<script lang="ts">
    interface IOption {
        label: string;
        value: string;
    }

    interface Props {
        onChange: (
            value: string | undefined,
        ) => void | Promise<void | undefined | null> | undefined | null;
        options?: IOption[];
        value: string;
    }

    let { onChange, options = [], value }: Props = $props();
</script>

<select
    class="dropdown"
    onchange={(event) => {
        // @ts-ignore
        onChange(event.target?.value);
    }}
    {value}
>
    {#each options as { label, value }}
        <option {value}>{label}</option>
    {/each}
</select>
