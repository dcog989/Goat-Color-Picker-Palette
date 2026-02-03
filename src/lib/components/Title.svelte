<script lang="ts">
    import { getApp } from '../context';

    const { color } = getApp();

    interface Props {
        name: string;
    }

    let { name }: Props = $props();

    const blockSize = 'w-10 h-10 lg:w-12 lg:h-12 text-lg md:text-xl lg:text-2xl';
    const gapSize = 'gap-1 md:gap-1';

    // Determine if we should use ticker display for long names
    let useTicker = $derived.by(() => {
        const letterCount = name.replace(/\s/g, '').length;
        const tickerThreshold = 18;
        return letterCount > tickerThreshold;
    });

    const getBlockStyle = (index: number) => {
        const l = color.l;
        const c = color.c;
        const h = color.h;

        const offset = (index % 3) * 0.05;
        const isDark = l < 0.5;

        const bgL = isDark ? Math.min(0.95, l + 0.25 + offset) : Math.max(0.05, l - 0.25 - offset);
        const bgC = Math.max(0, c * 0.6);

        const textL = bgL > 0.5 ? 0.15 : 0.98;
        const textC = c < 0.02 ? 0 : Math.max(0.1, c);

        const bgColor = `oklch(${bgL} ${bgC} ${h})`;
        const textColor = `oklch(${textL} ${textC} ${h})`;

        return { bgColor, textColor };
    };
</script>

{#if useTicker}
    <!-- Ticker display for very long names -->
    <div class="w-full max-w-[60vw] overflow-hidden">
        <div class="flex animate-bounce whitespace-nowrap {gapSize}">
            {#each name.toUpperCase().split('') as letter, i (i)}
                {#if letter === ' '}
                    <div
                        class="
                          w-3 transition-all duration-1000
                          md:w-5
                        ">
                    </div>
                {:else}
                    {@const style = getBlockStyle(i)}
                    <span
                        class="
                          inline-flex items-center justify-center
                          {blockSize}
                          cursor-default rounded-sm font-black
                          text-(--letter-text) shadow-md transition-all
                          duration-1000 select-none
                          [background:var(--letter-bg)]
                          hover:scale-110 hover:rotate-2
                        "
                        style:--letter-bg={style.bgColor}
                        style:--letter-text={style.textColor}>
                        {letter}
                    </span>
                {/if}
            {/each}
        </div>
    </div>
{:else}
    <!-- Normal display for regular length names -->
    <div
        class="
          flex flex-wrap justify-center
          {gapSize}">
        {#each name.toUpperCase().split('') as letter, i (i)}
            {#if letter === ' '}
                <div
                    class="
                      w-3 transition-all duration-1000
                      md:w-5
                    ">
                </div>
            {:else}
                {@const style = getBlockStyle(i)}
                <span
                    class="
                      inline-flex items-center justify-center
                      {blockSize}
                      cursor-default rounded-sm font-black text-(--letter-text)
                      shadow-md transition-all duration-1000 select-none
                      [background:var(--letter-bg)]
                      hover:scale-110 hover:rotate-2
                    "
                    style:--letter-bg={style.bgColor}
                    style:--letter-text={style.textColor}>
                    {letter}
                </span>
            {/if}
        {/each}
    </div>
{/if}

<style>
    @keyframes bounce-horizontal {
        0%,
        100% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(-20px);
        }
    }

    .animate-bounce {
        animation: bounce-horizontal 8s ease-in-out infinite;
    }
</style>
