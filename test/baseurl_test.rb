# frozen_string_literal: true

require_relative "test_helper"

class BaseurlTest < Minitest::Test
  BASEURL = ENV.fetch("SITE_BASEURL")

  def test_generated_local_references_keep_the_configured_baseurl
    Dir.glob(site_file("**/*.html")).each do |file|
      document = Nokogiri::HTML5(File.read(file))

      document.css("a[href], img[src], source[srcset], script[src], link[href]").each do |element|
        value = element["href"] || element["src"]
        value ||= element["srcset"]&.split(",")&.first&.split&.first
        next if value.nil? || value.empty? || value.start_with?("mailto:", "tel:", "data:", "javascript:", "#")

        uri = URI.parse(value)
        next unless uri.host.nil? || uri.host == "jboudoux.fr"

        assert uri.path.start_with?("#{BASEURL}/") || uri.path == BASEURL,
               "Missing baseurl for #{value.inspect} in #{file}"
      end

      canonical = document.at_css('link[rel="canonical"]')&.[]("href")
      assert canonical.start_with?("#{SITE_ORIGIN}#{BASEURL}/"), "Canonical missing baseurl in #{file}"
    end
  end
end
