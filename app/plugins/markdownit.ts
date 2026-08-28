import { imgLazyload } from "@mdit/plugin-img-lazyload";
import { tasklist } from "@mdit/plugin-tasklist";
import MarkdownIt from "markdown-it";

export default defineNuxtPlugin(() => {
  const md = MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  })
    .use(imgLazyload)
    .use(tasklist);
  return {
    provide: {
      mdRenderer: md,
    },
  };
});
