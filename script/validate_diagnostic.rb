#!/usr/bin/env ruby
# frozen_string_literal: true

site_dir = File.expand_path(ARGV.fetch(0, "_site"))
exec({ "SITE_DIR" => site_dir }, "bundle", "exec", "ruby", "-Itest", "test/diagnostic_test.rb")
