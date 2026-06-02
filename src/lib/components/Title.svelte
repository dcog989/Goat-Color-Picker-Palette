<script lang="ts">
import { onMount } from 'svelte';
import { getApp } from '../context';

const { color } = getApp();

interface Props {
    name: string;
}

let { name }: Props = $props();

const blockSize = 'w-10 h-10 lg:w-12 lg:h-12 text-lg md:text-xl lg:text-2xl';
const gapSize = 'gap-1 md:gap-1';

let letters = $derived(name.toUpperCase().split(''));
let container: HTMLDivElement;
let content: HTMLDivElement;
let overflow = $state(false);

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

function measure() {
    if (container && content) {
        overflow = content.scrollWidth > container.clientWidth;
    }
}

onMount(() => {
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
});

$effect(() => {
    name;
    measure();
});

$effect(() => {
    if (!overflow || !container || !content) return;

    const maxOffset = content.scrollWidth - container.clientWidth + 20;
    let startTime: number | null = null;
    let raf: number;
    const forwardTime = 8000;
    const backTime = 1000;
    const totalTime = forwardTime + backTime;

    function frame(now: number) {
        if (!startTime) startTime = now;
        const elapsed = (now - startTime) % totalTime;

        let progress: number;
        if (elapsed < forwardTime) {
            progress = elapsed / forwardTime;
        } else {
            progress = 1 - (elapsed - forwardTime) / backTime;
        }

        const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;

        const offset = eased * maxOffset;
        content.style.transform = `translateX(-${offset}px)`;
        raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
        cancelAnimationFrame(raf);
        if (content) content.style.transform = '';
    };
});
</script>

<div
    bind:this={container}
    class="w-full overflow-hidden flex"
    class:justify-center={!overflow}>
    <div
        bind:this={content}
        class="inline-flex whitespace-nowrap {gapSize}">
        {#each letters as letter, i}
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
</div>