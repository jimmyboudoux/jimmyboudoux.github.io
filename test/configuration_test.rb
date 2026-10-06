# frozen_string_literal: true

require_relative "test_helper"
require "tmpdir"
require "fileutils"
require "open3"

class ConfigurationTest < Minitest::Test
  def test_commercial_parameters_are_valid_numbers
    check_offer = lambda do |node|
      return unless node.is_a?(Hash)
      if node.key?("amount")
        assert_kind_of Integer, node.fetch("amount")
        assert_operator node.fetch("amount"), :>, 0
      end
      if node.key?("max_amount")
        assert_kind_of Integer, node.fetch("max_amount")
        assert_operator node.fetch("max_amount"), :>=, node.fetch("amount")
      end
      node.each_value { |child| check_offer.call(child) }
    end
    pricing = YAML.load_file("_data/pricing.yml")
    check_offer.call(pricing)
    YAML.load_file("_data/formations.yml").each_value do |formation|
      refute_empty formation.fetch("prices")
      formation.fetch("prices").each { |offer| check_offer.call(offer) }
      refute formation.key?("starting_price")
      refute formation.key?("price_amount")
    end
    engagement = YAML.load_file("_data/engagement.yml")
    [engagement.fetch("booking_minutes"), engagement.fetch("training_access_days"), *engagement.fetch("diagnostic").values,
     pricing.dig("sandbox", "duration_days"), pricing.dig("sandbox", "max_configurations"),
     pricing.dig("sandbox", "extension", "period_days"), pricing.dig("sandbox", "extension", "additional_configurations")].each do |value|
      assert_kind_of Integer, value
      assert_operator value, :>, 0
    end
    assert_operator engagement.dig("diagnostic", "duration_max_minutes"), :>=, engagement.dig("diagnostic", "duration_min_minutes")
  end

  # Build an isolated copy with different commercial data. This catches stale
  # values in pages without changing the repository's real offers.
  def test_parameter_changes_propagate_to_pages_and_structured_data
    Dir.mktmpdir("site-configuration-") do |directory|
      source = File.join(directory, "source")
      destination = File.join(directory, "output")
      FileUtils.mkdir_p(source)
      %w[_config.yml _data _includes _layouts _sass assets].each do |path|
        FileUtils.cp_r(path, source)
      end
      Dir.glob("**/*.{html,xml,txt}").reject { |path| path.start_with?("_", "node_modules/", "assets/") }.each do |path|
        next unless File.read(path).start_with?("---")

        target = File.join(source, path)
        FileUtils.mkdir_p(File.dirname(target))
        FileUtils.cp(path, target)
      end
      config_file = File.join(source, "_config.yml")
      config = YAML.load_file(config_file)
      config["person_name"] = "Alice & Martin"
      config["title"] = "Atelier de démonstration"
      config["portfolio_enabled"] = true
      File.write(config_file, YAML.dump(config))
      change_data(source, "pricing") do |data|
        data.fetch("framing")["amount"] = 1230
        data.fetch("automation")["amount"] = 1780
        data.dig("fractional", "light")["meetings_min"] = 3
        data.dig("fractional", "light")["meetings_max"] = 4
        data.fetch("sandbox")["amount"] = 2780
        data.fetch("sandbox")["duration_days"] = 45
        data.fetch("sandbox")["max_configurations"] = 7
        data.dig("sandbox", "hardware")["amount"] = 730
        data.dig("sandbox", "extension")["amount"] = 890
        data.dig("sandbox", "extension")["period_days"] = 60
        data.dig("sandbox", "extension")["additional_configurations"] = 2
        data.dig("audit", "ranges", "targeted")["amount"] = 2910
        data.dig("fractional", "light")["amount"] = 1100
      end
      change_data(source, "formations") { |data| data.dig("ai-literacy", "prices", 0)["amount"] = 735 }
      change_data(source, "engagement") do |data|
        data["booking_minutes"] = 35
        data["training_access_days"] = 21
        data.fetch("diagnostic")["duration_min_minutes"] = 6
        data.fetch("diagnostic")["duration_max_minutes"] = 9
        data.fetch("diagnostic")["response_days"] = 2
      end
      breakpoint_file = File.join(source, "_sass/base/_breakpoints.scss")
      File.write(breakpoint_file, File.read(breakpoint_file).sub("$breakpoint-menu: 900px", "$breakpoint-menu: 860px"))
      output, status = Open3.capture2e("bundle", "exec", "jekyll", "build", "--source", source, "--destination", destination)
      assert status.success?, output
      css = File.read(File.join(destination, "assets/css/site.css"))
      assert_includes css, "--menu-desktop-min: 861px"
      assert_includes css, "max-width: 860px"
      assert_includes css, "min-width: 861px"

      page = lambda do |path|
        file = path == "/" ? "index.html" : "#{path.delete_prefix("/")}index.html"
        Nokogiri::HTML5(File.read(File.join(destination, file)))
      end
      %w[/sandbox-ia-locale/ /tarifs/].each do |path|
        text = page.call(path).text.gsub(/\s+/, " ")
        ["À partir de 2 780 € HT", "+730 € HT", "+890 € HT / 60 jours", "45 jours", "7 configurations", "2 configurations pertinentes"].each do |value|
          assert_includes text, value, "Configuration not propagated to #{path}"
        end
        refute_includes text, "2 400 € HT"
      end
      %w[/tarifs/ /formations/ /formations/ai-literacy/].each do |path|
        assert_includes page.call(path).text.gsub(/\s+/, " "), "735 € HT"
        refute_includes page.call(path).text, "650 € HT"
      end
      %w[/ /services/ /tarifs/].each do |path|
        assert_includes page.call(path).text.gsub(/\s+/, " "), "1 230 € HT"
        refute_includes page.call(path).text, "900 € HT"
      end
      %w[/ /tarifs/].each do |path|
        assert_includes page.call(path).text.gsub(/\s+/, " "), "1 780 € HT"
      end
      assert_includes page.call("/tarifs/").text.gsub(/\s+/, " "), "3 à 4 points mensuels"
      %w[/ /mentions-legales/ /politique-confidentialite/ /diagnostic-ia/merci/].each do |path|
        assert_includes page.call(path).text, "Alice & Martin"
        refute_includes page.call(path).text, "Jimmy Boudoux"
      end
      assert_includes page.call("/about/").at_css("title").text, "Alice & Martin"
      assert_includes page.call("/contact/").at_css('meta[name="description"]')["content"], "Alice & Martin"
      %w[/formations/ /formations/ai-literacy/ /formations/finops-ia/ /formations/ia-locale/].each do |path|
        assert_includes page.call(path).text.gsub(/\s+/, " "), "21 jours ouvrés"
        refute_includes page.call(path).text, "15 jours ouvrés"
      end
      assert page.call("/").at_css("#realisations")
      assert page.call("/").at_css('nav[aria-label="Navigation principale"] a[href="/realisations/"]')
      assert page.call("/").at_css('nav[aria-label="Navigation de pied de page"] a[href="/realisations/"]')
      assert page.call("/services/").at_css('main a[href="/realisations/"]')
      course = page.call("/formations/ai-literacy/").css('script[type="application/ld+json"]').map { |script| JSON.parse(script.text) }.find { |item| item["@type"] == "Course" }
      assert_equal 735, course.fetch("offers").fetch("price")
      %w[/ /tarifs/ /ai-finops/].each do |path|
        assert_includes page.call(path).text.gsub(/\s+/, " "), "À partir de 2 910 € HT"
      end
      %w[/ /tarifs/].each do |path|
        assert_includes page.call(path).text.gsub(/\s+/, " "), "Dès 1 100 € HT / mois"
      end
      %w[/ /contact/ /formations/ /diagnostic-ia/ /diagnostic-ia/merci/].each do |path|
        text = page.call(path).text.gsub(/\s+/, " ")
        assert_match(/35 (min|minutes)/, text)
        refute_match(/\b20 (min|minutes)\b/, text)
        refute_match(/__(?:booking_minutes|max_configurations)__|\{\{|\{%/, text)
      end
      %w[/diagnostic-ia/].each do |path|
        assert_match(/6 à 9 (min|minutes)/, page.call(path).text.gsub(/\s+/, " "))
      end
      %w[/diagnostic-ia/ /diagnostic-ia/merci/].each do |path|
        assert_includes page.call(path).text.gsub(/\s+/, " "), "2 jours ouvrés"
      end
      assert_includes page.call("/diagnostic-ia/").at_css('meta[name="description"]')["content"], "2 jours ouvrés"
    end
  end

  private

  def change_data(source, name)
    file = File.join(source, "_data", "#{name}.yml")
    data = YAML.load_file(file)
    yield data
    File.write(file, YAML.dump(data))
  end
end
