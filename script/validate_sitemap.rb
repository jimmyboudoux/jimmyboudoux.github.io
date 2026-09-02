#!/usr/bin/env ruby
# frozen_string_literal: true

require "rexml/document"
require "uri"

SITE_URL = "https://jboudoux.fr"
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
  /poitiers/
  /grand-ouest/
  /about/
  /contact/
].freeze

sitemap_path = File.expand_path(ARGV.fetch(0, "_site/sitemap.xml"))
site_dir = File.dirname(sitemap_path)
abort "Sitemap not found: #{sitemap_path}" unless File.file?(sitemap_path)

begin
  document = REXML::Document.new(File.read(sitemap_path))
rescue REXML::ParseException => e
  abort "Invalid sitemap XML: #{e.message}"
end

abort "Sitemap root must be <urlset>" unless document.root&.name == "urlset"

locations = document.root.elements.to_a("url").filter_map do |entry|
  entry.elements["loc"]&.text&.strip
end
abort "Sitemap contains no URLs" if locations.empty?
abort "Sitemap contains duplicate URLs" unless locations.uniq.size == locations.size

paths = locations.map do |location|
  begin
    uri = URI.parse(location)
  rescue URI::InvalidURIError
    abort "Invalid URL in sitemap: #{location}"
  end

  unless uri.is_a?(URI::HTTPS) && uri.host == "jboudoux.fr" && uri.query.nil? && uri.fragment.nil?
    abort "Non-canonical URL in sitemap: #{location}"
  end

  path = uri.path
  unless path == "/" || path.end_with?("/")
    abort "URL must use the trailing-slash canonical convention: #{location}"
  end
  abort "Technical URL in sitemap: #{location}" if path == "/404.html" || path == "/sitemap.xml"

  output_file = path == "/" ? File.join(site_dir, "index.html") : File.join(site_dir, path, "index.html")
  abort "Sitemap URL has no generated HTML page: #{location}" unless File.file?(output_file)

  html = File.read(output_file)
  title = html[/<title>(.*?)<\/title>/mi, 1]&.strip
  abort "Missing title in generated page: #{location}" if title.nil? || title.empty?
  description = html[/<meta\s+name=[\"']description[\"']\s+content=[\"']([^\"']+)[\"']/i, 1]&.strip
  abort "Missing meta description in generated page: #{location}" if description.nil? || description.empty?
  h1_count = html.scan(/<h1(?:\s[^>]*)?>/i).size
  abort "Expected exactly one H1 in #{location}, found #{h1_count}" unless h1_count == 1
  unless html.include?(%(<link rel="canonical" href="#{location}">))
    abort "Canonical URL mismatch for #{location}"
  end
  abort "A noindex page is present in the sitemap: #{location}" if html.match?(/<meta\s+name=["']robots["']\s+content=["'][^"']*\bnoindex\b/i)

  path
end

missing_paths = EXPECTED_PATHS - paths
abort "Expected public pages missing from sitemap: #{missing_paths.join(', ')}" unless missing_paths.empty?

robots_path = File.join(site_dir, "robots.txt")
abort "robots.txt not generated" unless File.file?(robots_path)
unless File.read(robots_path).include?("Sitemap: #{SITE_URL}/sitemap.xml")
  abort "robots.txt does not reference #{SITE_URL}/sitemap.xml"
end

puts "Sitemap valid: #{locations.size} canonical public URLs."
