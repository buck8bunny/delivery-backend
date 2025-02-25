class Users::ProfilesController < ApplicationController
  def show
    render json: {
      email: current_user.email,
      name: current_user.name
    }
  end
end 