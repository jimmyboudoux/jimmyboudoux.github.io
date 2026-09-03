#!/usr/bin/env ruby
# frozen_string_literal: true

site_dir = File.expand_path(ARGV.fetch(0, "_site"))
diagnostic = File.read(File.join(site_dir, "diagnostic-ia", "index.html"))
thanks = File.read(File.join(site_dir, "diagnostic-ia", "merci", "index.html"))
home = File.read(File.join(site_dir, "index.html"))
sitemap = File.read(File.join(site_dir, "sitemap.xml"))

expected_fields = %w[
  company_size industry role ai_usage_level tools paid_licenses use_cases
  confidential_data_usage ai_policy training_level data_rules cost_visibility
  license_usage_visibility cost_evolution automation_potential data_hosting_concern
  private_ai_interest main_problem priorities horizon first_name last_name company
  email phone contact_preference newsletter_opt_in website
]

expected_fields.each do |name|
  abort "Missing diagnostic field: #{name}" unless diagnostic.match?(/name=["']#{Regexp.escape(name)}["']/)
end

abort "Diagnostic must contain seven steps" unless diagnostic.scan(/class="diagnostic-step"/).size == 7
abort "Human analysis promise is missing" unless diagnostic.include?("J’analyse personnellement") && diagnostic.include?("Il ne s’agit pas d’un score généré automatiquement")
abort "Homepage CTA is missing" unless home.include?('href="/diagnostic-ia/"') && home.include?("Faire mon diagnostic IA")
abort "Thank-you page must be noindex" unless thanks.match?(/name="robots" content="noindex"/)
abort "Thank-you page leaked into sitemap" if sitemap.include?("/diagnostic-ia/merci/")
abort "Diagnostic page missing from sitemap" unless sitemap.include?("/diagnostic-ia/")
abort "A score must not be shown on the thank-you page" if thanks.match?(/\b\d+\s*\/\s*100\b/)

puts "Diagnostic IA valid: 20 questions, contact step, human promise, SEO and confirmation checks passed."
