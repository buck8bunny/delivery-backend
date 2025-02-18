class RemoveRefreshTokenFromUsers < ActiveRecord::Migration[8.0]
  def change
    remove_column :users, :refresh_token, :string
  end
end
