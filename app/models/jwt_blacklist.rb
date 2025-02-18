class JwtBlacklist < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher
end
