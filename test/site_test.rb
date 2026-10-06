# frozen_string_literal: true

require_relative "test_helper"

class SiteTest < Minitest::Test
  EXPECTED_PATHS = %w[
    /
    /services/
    /ai-adoption/
    /ai-engineering/
    /sandbox-ia-locale/
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
    assert_equal 22, locations.size
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

  def test_local_ai_sandbox_offer_is_linked_and_scoped_as_a_poc
    sandbox = html_for_path("/sandbox-ia-locale/")
    assert_includes sandbox.css("h1").text, "Testez une IA locale avant d’investir"
    assert_includes sandbox.text.downcase, "#{YAML.load_file("_data/pricing.yml").dig("sandbox", "max_configurations")} configurations principales"
    assert_includes sandbox.text, "Time To First Token"
    %w[Dense MoE OCR Vision CPU GPU code].each do |term|
      assert_includes sandbox.text, term
    end
    assert_includes sandbox.text, "contexte court ou long"
    assert_includes sandbox.text, "environnement temporaire de test, de benchmark et d’aide à la décision"
    assert_includes sandbox.text, "données confidentielles"
    assert_includes sandbox.text, "#{formatted_amount(YAML.load_file("_data/pricing.yml").dig("sandbox", "amount"))} € HT"
    assert_includes sandbox.text, "+#{formatted_amount(YAML.load_file("_data/pricing.yml").dig("sandbox", "hardware", "amount"))} € HT"
    extension = YAML.load_file("_data/pricing.yml").dig("sandbox", "extension")
    assert_includes sandbox.text, "+#{formatted_amount(extension.fetch("amount"))} € HT / #{extension.fetch("period_days")} jours"

    %w[/services/ /ai-engineering/ /tarifs/].each do |path|
      assert html_for_path(path).css('a[href="/sandbox-ia-locale/"]').any?, "Missing sandbox link from #{path}"
    end
    assert_includes html_for_path("/services/").text, "Tester des modèles IA"

    homepage = html_for_path("/")
    assert homepage.css('a[href="/sandbox-ia-locale/"]').any?, "Missing sandbox service card on homepage"
    assert_includes homepage.text, "Découvrir la sandbox"
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
    assert_equal "Services", current.text

    home = html_for_path("/")
    refute home.at_css('nav[aria-label="Navigation principale"] a[aria-current="page"]')

    engineering = html_for_path("/ai-engineering/")
    assert_equal "Services", engineering.at_css('nav[aria-label="Navigation principale"] a[aria-current="page"]').text

    formation = html_for_path("/formations/ai-literacy/")
    assert_equal "Services", formation.at_css('nav[aria-label="Navigation principale"] a[aria-current="page"]').text
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
    assert_equal YAML.load_file("_data/formations.yml").fetch("ai-literacy").fetch("prices").map { |offer| offer.fetch("amount") }.min, course.fetch("offers").fetch("price")
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

  def test_formation_price_labels_and_secondary_diagnostic_access_remain_clear
    %w[/formations/ai-literacy/ /formations/finops-ia/ /formations/ia-locale/].each do |path|
      text = html_for_path(path).text
      refute_includes text, "À partir de dès"
      refute_includes text, "dès dès"
      refute_includes text, "À partir de à partir de"
    end

    homepage = html_for_path("/")
    assert homepage.at_css('a[href="/diagnostic-ia/"]')
    assert_empty homepage.css('main a[href="/diagnostic-ia/"]')
    assert html_for_path("/ai-adoption/").at_css('a[href="/diagnostic-ia/"]')
  end

  def test_shared_pricing_data_is_rendered_on_the_pricing_page
    pricing = YAML.load_file("_data/pricing.yml")
    offers = []
    collect = lambda do |node|
      return unless node.is_a?(Hash)
      offers << node if node.key?("amount")
      node.each_value { |value| collect.call(value) }
    end
    collect.call(pricing)
    pricing_page = html_for_path("/tarifs/").text.gsub(/\s+/, " ")
    offers.each do |offer|
      assert_includes pricing_page, "#{formatted_amount(offer.fetch("amount"))} € HT" unless offer.key?("max_amount")
      if offer.key?("max_amount")
        assert_includes pricing_page, "#{formatted_amount(offer.fetch("amount"))} – #{formatted_amount(offer.fetch("max_amount"))} € HT"
      end
    end
  end

  def test_faqs_and_catalogue_themes_are_explicit_and_consistent
    %w[/404.html /diagnostic-ia/merci/ /mentions-legales/ /politique-confidentialite/].each do |path|
      document = path == "/404.html" ? Nokogiri::HTML5(File.read(site_file("404.html"))) : html_for_path(path)
      assert_empty document.css(".site-faq__list"), "Unexpected commercial FAQ on #{path}"
    end
    services = YAML.load_file("_data/services.yml")
    %w[sandbox-ia-locale ia-privee-locale].each do |slug|
      service = services.find { |item| item.fetch("slug") == slug }
      document = html_for_path("/#{slug}/")
      assert_equal service.fetch("theme"), document.at_css("body")["class"]
      assert_equal "Services", document.at_css('nav[aria-label="Navigation principale"] a[aria-current="page"]').text
      assert json_ld_for("/#{slug}/").any? { |item| item["@type"] == "Service" }
    end
    %w[/ /ai-engineering/ /tarifs/ /contact/ /diagnostic-ia/ /formations/ai-literacy/].each do |path|
      assert_empty html_for_path(path).css(".site-faq__list"), "Repeated generic FAQ on #{path}"
    end
    overview = html_for_path("/services/")
    assert_equal 1, overview.css(".site-faq__list").size
    assert_operator overview.css("section").index { |section| section["id"] == "faq" }, :<,
                    overview.css("section").to_a.rindex { |section| section.at_css(".cta-box") }
    public_paths.each do |path|
      document = html_for_path(path)
      locations = JSON.parse(document.at_css("body")["data-booking-locations"])
      document.css("[data-booking-location]").each { |link| assert_includes locations, link["data-booking-location"] }
      document.css('script[type="application/ld+json"]').each do |script|
        data = JSON.parse(script.text)
        next unless data["@type"] == "FAQPage"
        actual = document.css(".site-faq__list details").map { |detail| [detail.at_css("summary").text.strip, detail.at_css("p").text.strip] }
        expected = data.fetch("mainEntity").map { |item| [item.fetch("name"), item.fetch("acceptedAnswer").fetch("text")] }
        assert_equal expected, actual, "FAQ markup differs from visible answers on #{path}"
      end
    end
  end

  def test_homepage_has_distinct_roles_and_no_duplicate_diagnostic_promotion
    document = html_for_path("/")
    hero = document.at_css(".hero")
    assert_equal 1, hero.css("p.lead").size
    assert_equal 2, hero.css(".actions a").size
    assert_empty hero.css('a[href="/diagnostic-ia/"], .engineering-map, .hero-principles')
    assert_empty document.css(".home-diagnostic")
    assert_empty document.css('main a[href="/diagnostic-ia/"]')
    assert_equal 1, document.css(".engineering-map").size
    assert document.at_css("#approche .engineering-map")
    assert_empty document.css("#pour-qui")
  end

  def test_repositioning_is_clear_and_specialist_pages_remain_secondary
    document = html_for_path("/")
    assert_equal "De l’idée métier à la solution logicielle complète.", document.at_css("h1").text.strip
    assert_includes document.at_css("title").text, "Ingénieur Informatique & Architecte IA"
    assert_includes document.at_css(".hero .eyebrow").text, "Ingénieur Informatique & Architecte IA"
    assert_equal "Parler de mon projet", document.at_css(".hero .actions a").text.strip
    assert_equal ["Concevoir", "Construire", "Transformer"], document.css("#services .card-tag").map { |node| node.text.strip }
    assert_includes document.at_css("#services").text, "avec ou sans intelligence artificielle"
    assert_equal ["Comprendre", "Concevoir", "Construire", "Intégrer", "Déployer"], document.css("#approche .map-card b").map(&:text)
    assert_equal 3, document.css("#pourquoi .card").size
    assert_equal 3, document.css("#tarifs .price-card").size
    ids = document.css("main > section[id]").map { |node| node["id"] }
    assert_equal %w[services approche expertises pourquoi tarifs], ids
    nav = document.css('nav[aria-label="Navigation principale"] a:not(.nav-cta)')
    assert_equal ["Services", "À propos", "Tarifs", "Contact"], nav.map(&:text)
    assert_equal "Parler de mon projet", document.at_css(".nav-cta").text.strip
    %w[ai-engineering sandbox-ia-locale ia-privee-locale software-rescue data-reporting ai-finops ai-adoption formations fractional-lead].each do |slug|
      assert html_for_path("/services/").at_css("main a[href='/#{slug}/']"), "Missing specialist link: #{slug}"
    end
    %w[/poitiers/ /grand-ouest/].each do |path|
      assert_includes html_for_path(path).at_css("h1").text, "Ingénieur Informatique & Architecte IA"
    end
  end

  def test_portfolio_is_prepared_but_hidden_and_not_indexed
    document = html_for_path("/realisations/")
    assert_equal 1, document.css("h1").size
    assert_equal "noindex", document.at_css('meta[name="robots"]')["content"]
    assert_equal "#{SITE_ORIGIN}/realisations/", document.at_css('link[rel="canonical"]')["href"]
    refute_includes public_paths, "/realisations/"
    assert_empty html_for_path("/").css("#realisations")
    public_paths.each do |path|
      assert_empty html_for_path(path).css('a[href="/realisations/"]'), "Portfolio should be hidden on #{path}"
    end
    assert_includes document.at_css("main").text, "En construction"
    refute document.at_css("main").text.match?(/client|résultat chiffré/)
  end

  def test_robots_references_the_generated_sitemap
    assert_includes File.read(site_file("robots.txt")), "Sitemap: #{SITE_ORIGIN}/sitemap.xml"
  end

  private

  def formatted_amount(amount)
    amount.to_s.reverse.scan(/.{1,3}/).join(" ").reverse
  end

  def json_ld_for(path)
    html_for_path(path).css('script[type="application/ld+json"]').map { |script| JSON.parse(script.text) }
  end
end
