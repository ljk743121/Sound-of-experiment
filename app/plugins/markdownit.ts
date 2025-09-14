import { abbr } from "@mdit/plugin-abbr";
import { alert } from "@mdit/plugin-alert";
import { align } from "@mdit/plugin-align";
import { dl } from "@mdit/plugin-dl";
import { figure } from "@mdit/plugin-figure";
import { footnote } from "@mdit/plugin-footnote";
import { icon } from "@mdit/plugin-icon";
import { imgLazyload } from "@mdit/plugin-img-lazyload";
import { ins } from "@mdit/plugin-ins";
import { katex } from "@mdit/plugin-katex";
import { mark } from "@mdit/plugin-mark";
import { sub } from "@mdit/plugin-sub";
import { sup } from "@mdit/plugin-sup";
import { tab } from "@mdit/plugin-tab";
import { tasklist } from "@mdit/plugin-tasklist";
import MarkdownIt from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import highlight from "markdown-it-highlightjs";

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
    .use(tasklist)
    .use(abbr)
    .use(align)
    .use(ins)
    .use(tab)
    .use(dl)
    .use(alert)
    .use(highlight)
    .use(emoji);
  return {
    provide: {
      mdRenderer: md,
    },
  };
});
