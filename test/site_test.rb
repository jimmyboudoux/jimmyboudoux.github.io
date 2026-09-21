# frozen_string_literal: true

require_relative "test_helper"

class SiteTest < Minitest::Test
  EXPECTED_PATHS = %w[
    /
    /services/
    /ai-adoption/
    /ai-engineering/
    /software-rescue/
    /data-reporting/
    /ai-finops/
    /fractional-lead/
    /formations/
    /formations/ai-literacy/
    /formations/finops-ia/
    /formations/ia-locale/
    /ia-privee-locale/
    /poitiers/
    /grand-ouest/
    /about/
    /contact/
    /diagnostic-ia/
    /mentions-legales/
    /politique-confidentialite/
    /tarifs/
  ].freeze

  def test_sitemap_contains_canonical_public_pages
    sitemap = Nokogiri::XML(File.read(site_file("sitemap.xml")))
    assert_empty sitemap.errors
    sitemap.remove_namespaces!
    locations = sitemap.css("url > loc").map { |node| node.text.strip }

    refute_empty locations
    assert_equal locations.uniq, locations
    assert_equal 21, locations.size
    assert_empty EXPECTED_PATHS - public_paths
    refute_includes public_paths, "/404.html"
    refute_includes public_paths, "/diagnostic-ia/merci/"
  end

  def test_public_pages_have_required_seo_metadata
    seen_titles = {}
    seen_descriptions = {}

    public_paths.each do |path|
      document = html_for_path(path)
      title = document.at_css("title")&.text&.strip
      description = document.at_css('meta[name="description"]')&.[]("content")&.strip

      refute_nil title, "Missing title for #{path}"
      refute_empty title, "Empty title for #{path}"
      refute_nil description, "Missing description for #{path}"
      refute_empty description, "Empty description for #{path}"
      refute seen_titles.key?(title), "Duplicate title #{title.inspect}"
      refute seen_descriptions.key?(description), "Duplicate description #{description.inspect}"
      seen_titles[title] = path
      seen_descriptions[description] = path

      assert_equal 1, document.css("h1").size, "Expected exactly one h1 in #{path}"
      assert_equal "#{SITE_ORIGIN}#{path}", document.at_css('link[rel="canonical"]')&.[]("href")
      refute document.at_css('meta[name="robots"]')&.[]("content")&.match?(/\bnoindex\b/i)
    end
  end

  def test_noindex_pages_are_not_in_the_sitemap
    Dir.glob(site_file("**/*.html")).each do |file|
      document = Nokogiri::HTML5(File.read(file))
      robots = document.at_css('meta[name="robots"]')&.[]("content")
      next unless robots&.match?(/\bnoindex\b/i)

      path = "/#{file.delete_prefix("#{SITE_DIR}/").delete_suffix("index.html")}".gsub(%r{/+}, "/")
      refute_includes public_paths, path
    end
  end

  def test_generated_internal_links_assets_and_anchors_exist
    Dir.glob(site_file("**/*.html")).each do |file|
      document = Nokogiri::HTML5(File.read(file))
      source_path = "/#{file.delete_prefix("#{SITE_DIR}/").delete_suffix("index.html")}".gsub(%r{/+}, "/")
      source_path = "/" if source_path == "/"

      document.css("a[href], img[src], source[srcset], script[src], link[href]").each do |element|
        value = element["href"] || element["src"]
        value ||= element["srcset"]&.split(",")&.first&.split&.first
        next if value.nil? || value.empty? || value.start_with?("mailto:", "tel:", "data:", "javascript:")

        uri = URI.parse(value)
        next unless uri.host.nil? || uri.host == "jboudoux.fr"

        target = local_file_for(uri, source_path)
        assert File.file?(target), "Missing local reference #{value.inspect} in #{file}"
        next if uri.fragment.nil? || uri.fragment.empty?

        target_document = Nokogiri::HTML5(File.read(target))
        assert target_document.at_css("##{uri.fragment}"), "Missing anchor ##{uri.fragment} for #{value.inspect} in #{file}"
      end
    end
  end

  def test_json_ld_and_analytics_are_valid_and_configured
    document = html_for_path("/")
    parsed = JSON.parse(document.at_css('script[type="application/ld+json"]')&.text)

    assert_equal "https://schema.org", parsed.fetch("@context")
    assert_equal 3, parsed.fetch("@graph").size
    assert_equal "jboudoux.fr", document.at_css("script[data-website-id]")&.[]("data-domains")
  end

  def test_navigation_marks_only_the_active_page
    services = html_for_path("/services/")
    current = services.at_css('nav[aria-label="Navigation principale"] a[aria-current="page"]')
    assert_equal "Expertises", current.text

    home = html_for_path("/")
    refute home.at_css('nav[aria-label="Navigation principale"] a[aria-current="page"]')

    engineering = html_for_path("/ai-engineering/")
    assert_equal "Expertises", engineering.at_css('nav[aria-label="Navigation principale"] a[aria-current="page"]').text

    formation = html_for_path("/formations/ai-literacy/")
    assert_equal "Formations IA", formation.at_css('nav[aria-label="Navigation principale"] a[aria-current="page"]').text
  end

  def test_internal_maintenance_files_are_not_published
    refute File.exist?(site_file("todo_refactoring.md"))
    refute Dir.exist?(site_file("docs"))
  end

  def test_compiled_styles_keep_accessibility_and_diagnostic_safety_rules
    css = File.read(site_file("assets/css/site.css"))

    assert_includes css, "prefers-reduced-motion: reduce"
    assert_includes css, ".diagnostic-honeypot"
    assert_includes css, ".conditional-field"
    assert_includes css, ".diagnostic-form-error"
    refute File.exist?(site_file("assets/css/style.css")), "The unused Primer stylesheet must not be generated"
  end

  def test_generated_pages_keep_basic_accessibility_landmarks
    Dir.glob(site_file("**/*.html")).each do |file|
      document = Nokogiri::HTML5(File.read(file))
      assert_equal "fr", document.at_css("html")&.[]("lang"), "Missing French document language in #{file}"
      assert document.at_css("main#main-content"), "Missing main landmark in #{file}"
      assert document.at_css('a.skip-link[href="#main-content"]'), "Missing skip link in #{file}"
      document.css("img").each do |image|
        refute_nil image["alt"], "Image without alt attribute in #{file}: #{image["src"]}"
      end

      levels = document.css("h1, h2, h3, h4, h5, h6").map { |heading| heading.name.delete_prefix("h").to_i }
      refute levels.each_cons(2).any? { |previous, current| current > previous + 1 },
             "Heading level skipped in #{file}"
    end
  end

  def test_page_specific_structured_data_is_valid
    service = json_ld_for("/ai-engineering/").find { |item| item["@type"] == "Service" }
    assert_equal "Ingénierie IA & automatisation", service.fetch("name")
    assert_equal "France", service.fetch("areaServed").fetch("name")

    course = json_ld_for("/formations/ai-literacy/").find { |item| item["@type"] == "Course" }
    assert_equal 650, course.fetch("offers").fetch("price")
    assert_equal "EUR", course.fetch("offers").fetch("priceCurrency")

    breadcrumb = json_ld_for("/formations/ai-literacy/").find { |item| item["@type"] == "BreadcrumbList" }
    assert_equal 3, breadcrumb.fetch("itemListElement").size

    faq = json_ld_for("/poitiers/").find { |item| item["@type"] == "FAQPage" }
    assert_equal 6, faq.fetch("mainEntity").size
  end

  def test_optimized_assets_are_generated_and_originals_are_not_published
    assert File.file?(site_file("assets/img/avatar-512.webp"))
    assert File.file?(site_file("assets/img/og-optimized.jpg"))
    refute File.exist?(site_file("assets/img/avatar.png"))
    refute File.exist?(site_file("assets/img/og.png"))
  end

  def test_generated_assets_stay_within_maintenance_budgets
    assert_operator File.size(site_file("assets/css/site.css")), :<, 60_000
    assert_operator File.size(site_file("assets/js/site.mjs")), :<, 5_000
    assert_operator File.size(site_file("assets/img/avatar-512.webp")), :<, 100_000
    assert_operator File.size(site_file("assets/img/og-optimized.jpg")), :<, 500_000
  end

  def test_formation_price_labels_and_homepage_diagnostic_cta_remain_clear
    %w[/formations/ai-literacy/ /formations/finops-ia/ /formations/ia-locale/].each do |path|
      text = html_for_path(path).text
      refute_includes text, "À partir de dès"
      refute_includes text, "dès dès"
      refute_includes text, "À partir de à partir de"
    end

    homepage = html_for_path("/")
    assert homepage.at_css('a[href="/diagnostic-ia/"]')
    assert_includes homepage.text, "Faire mon diagnostic IA"
  end

  def test_shared_pricing_data_is_rendered_on_the_pricing_page
    pricing = YAML.load_file("_data/pricing.yml")
    prices = [
      pricing.dig("expert_review", "price"),
      pricing.dig("framing", "price"),
      pricing.dig("automation", "starting_price"),
      pricing.dig("local_ai", "prototype", "starting_price"),
      pricing.dig("ai_portal", "essential", "starting_price"),
      pricing.dig("ai_portal", "enterprise", "starting_price"),
      pricing.dig("software_rescue", "starting_price"),
      pricing.dig("audit", "starting_price"),
      pricing.dig("fractional", "starting_price")
    ] + pricing.fetch("audit").fetch("ranges").values.map { |range| range.fetch("range") } +
      pricing.fetch("fractional").slice("light", "regular", "transverse", "reinforced").values.map { |range| range.fetch("range") }

    pricing_page = html_for_path("/tarifs/").text
    prices.each { |price| assert_includes pricing_page, price }
  end

  def test_robots_references_the_generated_sitemap
    assert_includes File.read(site_file("robots.txt")), "Sitemap: #{SITE_ORIGIN}/sitemap.xml"
  end

  private

  def json_ld_for(path)
    html_for_path(path).css('script[type="application/ld+json"]').map { |script| JSON.parse(script.text) }
  end
end
