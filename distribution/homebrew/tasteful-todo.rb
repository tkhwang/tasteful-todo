cask "tasteful-todo" do
  arch arm: "aarch64", intel: "x64"

  version "0.0.0"
  sha256 arm:   "0000000000000000000000000000000000000000000000000000000000000000",
         intel: "0000000000000000000000000000000000000000000000000000000000000000"

  url "https://github.com/tkhwang/tasteful-todo/releases/download/v#{version}/TastefulTodo_#{version}_#{arch}.dmg"
  name "Tasteful Todo"
  desc "Goal-based todo planner with a drag-and-drop day timeline"
  homepage "https://github.com/tkhwang/tasteful-todo"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on macos: :ventura

  app "TastefulTodo.app"

  uninstall quit: "com.tkhwang.tasteful-todo"

end
