# frozen_string_literal: true

require_relative "test_helper"

class DiagnosticTest < Minitest::Test
  CONTACT_FIELDS = %w[first_name last_name company email phone contact_preference newsletter_opt_in website].freeze

  def setup
    @definition = YAML.load_file("_data/diagnostic.yml")
    @document = html_for_path("/diagnostic-ia/")
  end

  def test_definition_has_unique_question_names
    questions = @definition.fetch("steps").flat_map { |step| step.fetch("questions") }
    names = questions.map { |question| question.fetch("name") }

    assert_equal names.uniq, names
    assert_equal 20, questions.size
  end

  def test_generated_form_matches_the_definition
    questions = @definition.fetch("steps").flat_map { |step| step.fetch("questions") }
    names = questions.map { |question| question.fetch("name") }
    generated_names = @document.css("input[name], select[name], textarea[name]").map { |element| element["name"] }

    assert_equal 7, @document.css("fieldset.diagnostic-step").size
    assert_equal names.sort, (generated_names & names).uniq.sort
    assert_empty names - generated_names
    assert_empty CONTACT_FIELDS - generated_names
    assert @document.at_css("altcha-widget[name='altcha']")
  end

  def test_generated_form_ids_are_unique
    ids = @document.css("[id]").map { |element| element["id"] }
    assert_equal ids.uniq, ids
  end

  def test_confirmation_page_is_private_and_the_diagnostic_is_public
    thanks = html_for_path("/diagnostic-ia/merci/")
    assert_equal "noindex", thanks.at_css('meta[name="robots"]')&.[]("content")
    assert_includes public_paths, "/diagnostic-ia/"
    refute_includes public_paths, "/diagnostic-ia/merci/"
  end

  def test_human_analysis_promises_remain_present
    text = @document.text
    assert_includes text, "J’analyse personnellement"
    assert_includes text, "Il ne s’agit pas d’un score généré automatiquement"
  end

  def test_form_announces_progress_and_errors
    progress = @document.at_css(".diagnostic-progress[role='progressbar']")
    assert_equal "1", progress&.[]("aria-valuenow")
    assert_equal "7", progress&.[]("aria-valuemax")
    assert @document.at_css(".diagnostic-progress__meta[aria-live='polite']")
    assert @document.at_css('[data-form-error][role="alert"][aria-live="assertive"]')
    assert_equal @document.css(".form-question .field-error").size,
                 @document.css(".form-question .field-error[aria-live='polite']").size
    @document.css(".form-question .field-error").each do |error|
      assert @document.at_css(%([aria-describedby~="#{error['id']}"]), "Missing error association for #{error['id']}")
    end
  end

  def test_form_endpoint_and_fallback_contact_are_explicit
    config = YAML.load_file("_config.yml")
    form = @document.at_css("form[data-diagnostic-form]")

    assert_equal config.fetch("diagnostic_api_url"), form["data-api-endpoint"]
    assert @document.at_css("noscript a[href='/contact/']")
  end
end
