import antfu from "@antfu/eslint-config";

export default antfu(
  {
    formatters: true,
    unocss: false,
    vue: true,
    stylistic: {
      indent: 2,
      quotes: "double",
      semi: true,
    },
    ignores: ["public/**", "app/components/ui/**", ".github/**", ".husky/**", "pnpm-lock.yaml", "pnpm-workspace.yaml"],
    regexp: false,
  },
  {
    plugins: {},
    rules: {
      "vue/block-order": [
        "error",
        {
          order: ["template", "script", "style"],
        },
      ],
      "style/brace-style": ["warn", "1tbs", { allowSingleLine: true }],
      "node/prefer-global/process": "off",
    },
  },
);
