<script lang="ts">
  interface Props {
    isEnabled: boolean;
    onChange: (value: boolean) => void;
  }

  let { isEnabled, onChange }: Props = $props();
</script>

<label
  class="checkbox-container cursor-[var(--cursor)]"
  class:is-enabled={isEnabled}
  tabindex="0"
  onkeydown={(event) => {
    if (
      event.target === event.currentTarget &&
      (event.key === "Enter" || event.key === " ")
    ) {
      onChange(!isEnabled);
    }
  }}
>
  <input
    class="cursor-[var(--cursor)]"
    type="checkbox"
    tabindex="0"
    onchange={() => onChange(!isEnabled)}
  />
</label>
