import { PixieBuildMark } from "./pixiebuild-mark";

export function BuiltBy() {
  return (
    <a
      href="https://pixiebuild.com"
      target="_blank"
      rel="noopener noreferrer"
      title="Built by PixieBuild"
      aria-label="Built by PixieBuild — opens pixiebuild.com in a new tab"
      className="group fixed right-5 bottom-5 z-30 hidden size-11 place-items-center rounded-full border border-background/10 bg-foreground/75 backdrop-blur-md transition-colors duration-500 ease-out hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid"
    >
      <PixieBuildMark className="size-4 text-background/70 transition-colors duration-500 ease-out group-hover:text-background" />
    </a>
  );
}
