<script lang="ts">
  interface Props {
    filepathsLength: number;
  }

  let { filepathsLength }: Props = $props();
</script>

Update stickers in <span class="u-pop"
  >{filepathsLength} {filepathsLength === 1 ? "file" : "files"}</span
>?
