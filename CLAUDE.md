# Claude Guidance for js_widget_runtime

Start with `AGENTS.md` for project conventions, commands, and architecture.

For task-specific guidance, use the skills in `.agents/skills/`:

- **Writing JS widgets** → `.agents/skills/js-widget-authoring/SKILL.md`
- **Extending the engine** → `.agents/skills/js-widget-engine/SKILL.md`

When changing JS API surface, engine handlers, renderer types, or example widgets, always update both the relevant skill and any affected tests.
