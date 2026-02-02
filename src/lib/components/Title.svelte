<script lang="ts">
    import { getApp } from '../context';

    const { color } = getApp();

    interface Props {
        name: string;
    }

    let { name }: Props = $props();

    // Calculate dynamic size based on name length to prevent wrapping
    let blockSize = $derived(() => {
        const letterCount = name.replace(/\s/g, '').length;

        // Use consistent readable size when in ticker mode
        if (letterCount > 18) {
            return 'w-7 h-7 md:w-9 md:h-9 lg:w-11 lg:h-11 text-base md:text-lg lg:text-xl';
        }

        // Normal sizing for non-ticker mode
        if (letterCount <= 8)
            return 'w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-lg md:text-xl lg:text-2xl';
        if (letterCount <= 12)
            return 'w-7 h-7 md:w-9 md:h-9 lg:w-11 lg:h-11 text-base md:text-lg lg:text-xl';
        if (letterCount <= 16)
            return 'w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-sm md:text-base lg:text-lg';
        return 'w-5 h-5 md:w-7 md:h-7 lg:w-9 lg:h-9 text-xs md:text-sm lg:text-base';
    });

    let gapSize = $derived(() => {
        const length = name.replace(/\s/g, '').length;
        if (length <= 8) return 'gap-1 md:gap-2';
        if (length <= 12) return 'gap-1.5 md:gap-2.5';
        return 'gap-1 md:gap-2';
    });

    // Determine if we should use ticker display for very long names
    let useTicker = $derived(() => {
        const letterCount = name.replace(/\s/g, '').length;
        return letterCount > 18; // Use ticker for very long names (>18 letters)
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

{#if useTicker()}
    <!-- Ticker display for very long names -->
    <div class="overflow-hidden w-full max-w-[60vw]">
        <div class="flex animate-bounce whitespace-nowrap" style="gap: 0.5rem;">
            {#each name.toUpperCase().split('') as letter, i (i)}
                {#if letter === ' '}
                    <div class="w-3 md:w-5 transition-all duration-1000"></div>
                {:else}
                    {@const style = getBlockStyle(i)}
                    <span
                        class="inline-flex items-center justify-center {blockSize} font-black rounded-sm shadow-md transition-all duration-1000 hover:scale-110 hover:rotate-2 cursor-default select-none [background:var(--letter-bg)] [color:var(--letter-text)]"
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
    <div class="flex flex-wrap justify-center {gapSize}" style="gap: 0.5rem;">
        {#each name.toUpperCase().split('') as letter, i (i)}
            {#if letter === ' '}
                <div class="w-3 md:w-5 transition-all duration-1000"></div>
            {:else}
                {@const style = getBlockStyle(i)}
                <span
                    class="inline-flex items-center justify-center {blockSize} font-black rounded-sm shadow-md transition-all duration-1000 hover:scale-110 hover:rotate-2 cursor-default select-none [background:var(--letter-bg)] [color:var(--letter-text)]"
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
