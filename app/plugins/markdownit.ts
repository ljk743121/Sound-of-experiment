import MarkdownIt from "markdown-it";
import { figure } from "@mdit/plugin-figure";
import { footnote } from "@mdit/plugin-footnote";
import { icon } from "@mdit/plugin-icon";
import { imgLazyload } from "@mdit/plugin-img-lazyload";
import { katex } from "@mdit/plugin-katex";
import { mark } from "@mdit/plugin-mark";
import { sub } from "@mdit/plugin-sub";
import { sup } from "@mdit/plugin-sup";
import { tasklist } from "@mdit/plugin-tasklist";

export default defineNuxtPlugin(() => {
  const md = MarkdownIt({
              html: true,
              linkify: true,
              typographer: true,
              breaks: true,
            })
              .use(figure)
              .use(footnote)
              .use(icon)
              .use(imgLazyload)
              .use(katex)
              .use(mark)
              .use(sub)
              .use(sup)
              .use(tasklist);
  return {
    provide: {
      mdRenderer: md,
    },
  };
});