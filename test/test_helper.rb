# frozen_string_literal: true

require "minitest/autorun"
require "json"
require "nokogiri"
require "uri"
require "yaml"

module SiteTestHelper
  SITE_DIR = File.expand_path(ENV.fetch("SITE_DIR", "_site"), Dir.pwd)
  SITE_ORIGIN = "https://jboudoux.fr"

  def site_file(path)
    File.join(SITE_DIR, path)
  end

  def html_for_path(path, presentation: "commercial")
    relative_path = path == "/" ? "index.html" : File.join(path.delete_prefix("/"), "index.html")
    presentation_document(File.read(site_file(relative_path)), presentation: presentation)
  end

  # Model the active DOM: template descendants are inert in the browser.
  def presentation_document(html, presentation: "commercial")
    document = Nokogiri::HTML5(html)
    if presentation != document.at_css("html")["data-presentation"]
      %w[header footer home].each do |region|
        host = document.at_css(region == "home" ? "[data-home-content]" : "[data-#{region}-host]")
        template = document.at_css("template[data-region='#{region}']")
        host.inner_html = template.inner_html if host && template
      end
    end
    document.at_css(".site-sidebar")&.remove if presentation == "commercial"
    document.css("template").remove
    document.at_css("html")["data-presentation"] = presentation
    document
  end

  def public_paths
    sitemap = Nokogiri::XML(File.read(site_file("sitemap.xml")))
    sitemap.remove_namespaces!
    sitemap.css("url > loc").map { |node| URI.parse(node.text).path }
  end

  def local_file_for(uri, source_path)
    return nil unless uri.host.nil? || uri.host == "jboudoux.fr"

    path = uri.path.to_s
    path = source_path if path.empty?
    path = "/" if path.empty?
    path = "/#{path}" unless path.start_with?("/")
    path = "/index.html" if path == "/"

    if File.extname(path).empty? && !path.end_with?("/")
      path = "#{path}/index.html"
    elsif path.end_with?("/")
      path = "#{path}index.html"
    end

    site_file(path.delete_prefix("/"))
  end
end

class Minitest::Test
  include SiteTestHelper
end
