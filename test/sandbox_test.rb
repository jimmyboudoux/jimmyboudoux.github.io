# frozen_string_literal: true

require_relative "test_helper"

class SandboxTest < Minitest::Test
  def test_rendered_configurator_uses_central_data_and_native_accessible_controls
    page = html_for_path("/sandbox-ia-locale/")
    form = page.at_css("form[data-sandbox-form]")
    pricing = YAML.load_file("_data/pricing.yml").fetch("sandbox")
    catalog = YAML.load_file("_data/sandbox.yml")
    assert_equal pricing, JSON.parse(form["data-pricing"])
    assert_equal catalog, JSON.parse(form["data-catalog"])
    assert form.key?("hidden"), "Must keep no-JS visitors on the static contact fallback"
    assert page.at_css("[data-sandbox-fallback] a[href^='mailto:']")
    refute_match(/(?:dès|forfait à) À partir de/, page.text.gsub(/\s+/, " "))
    assert_equal "2 500 € HT", form.at_css("[data-total]").text.gsub(/\s+/, " ").strip
    assert_equal 6, form.css("fieldset").length
    assert_equal ["api", "hosted"], form.css("input[name='interface']").map { |input| input["value"] }
    refute_includes form.text, "LibreChat"
    assert_equal ["lite", "standard", "premium"], form.css("input[name='profiles']").map { |input| input["value"] }
    assert_includes form.text.gsub(/\s+/, " "), "702 € HT"
    assert_includes form.text.gsub(/\s+/, " "), "10 % de remise"
    refute_match(/Mac mini|Mac Studio|Ryzen|RTX/, form.text)
    assert_includes form.text, "modèles de texte, de code, d’image/vision, d’OCR"
    refute File.exist?(site_file("QCM_20261113160740.md")), "Decision files must not be published"
    form.css("fieldset").each { |fieldset| refute_empty fieldset.at_css("legend").text }
    { "objectives" => catalog.fetch("objectives"), "profiles" => catalog.fetch("profiles"), "configurations" => pricing.fetch("configurations"), "interface" => pricing.fetch("interfaces"), "extras" => pricing.fetch("extras") }.each do |name, options|
      controls = form.css("input[name='#{name}']")
      assert_equal options.map { |option| option.fetch("id") }, controls.map { |control| control["value"] }
      expected_type = %w[configurations interface].include?(name) ? "radio" : "checkbox"
      controls.each do |control|
        assert_equal expected_type, control["type"]
        assert control.ancestors("label").any?, "Missing accessible label for #{name}"
      end
    end
    %w[prospect company email].each { |name| assert form.at_css("[name='#{name}'][required]") }
    assert form.at_css("input[name='email'][type='email'][autocomplete='email']")
    assert form.at_css("textarea[name='comment'][maxlength]")
    assert form.at_css("textarea[data-recap][readonly]")
    assert form.at_css("button[type='reset']")
    assert form.at_css("button[data-copy][type='button']")
    assert form.at_css(".sandbox-total[role='status'][aria-atomic='true']")
    assert_equal "Recevoir mon devis personnalisé", form.at_css("button[type='submit']").text.strip
    refute page.at_css('script:not([src]):not([type="application/ld+json"])'), "No new executable inline scripts"
    assert_empty form.css("[onclick], [onchange], [oninput], [style]")
    assert page.at_css('script[type="module"][src^="/assets/js/sandbox/index.mjs"]')
  end

  def test_offer_is_featured_before_services_in_both_home_presentations
    %w[minimalist commercial].each do |presentation|
      home = html_for_path("/", presentation: presentation)
      feature = home.at_css(".home-sandbox")
      refute_nil feature
      assert_equal 1, home.css("#home-sandbox-title").length
      assert feature.at_css('a[href="/sandbox-ia-locale/#configurateur"]')
      assert_equal 1, feature.css(".actions a").length
      refute_includes feature.text, "Découvrir le laboratoire"
      assert_operator home.css("*").to_a.index(feature), :<, home.css("*").to_a.index(home.at_css("#services"))
      assert_equal %w[Expérimenter Comparer Décider], feature.css("h3").map(&:text)
      %w[Apple AMD NVIDIA].each { |word| assert_includes feature.text, word }
    end
  end

  def test_scope_and_renewal_conditions_are_explicit_without_old_bundle
    sandbox = html_for_path("/sandbox-ia-locale/").text.gsub(/\s+/, " ")
    ["sans acheter de matériel", "pas de disponibilité permanente garantie", "ni de SLA de production", "Aucun accès direct", "anonymisées", "licences", "Sur devis selon les accès et prestations maintenus", "ne s’additionnent pas automatiquement"].each { |phrase| assert_includes sandbox, phrase }
    %w[/sandbox-ia-locale/ /tarifs/].each do |path|
      text = html_for_path(path).text.gsub(/\s+/, " ")
      refute_match(/5 configurations principales|Benchmark matériel\s*:\s*\+600|Prolongation\s*:\s*\+650/, text)
    end
  end
end
