import { Meta, Title } from "@solidjs/meta"
import { Layout } from "#src/pages/Layout.jsx"
import { Show, onMount } from "solid-js"
import type { GeneratedTableOfContents as ProcessedTableOfContents } from "./index.page.server.jsx"
import { defaultLanguage } from "#src/renderer/_default.page.route.js"
import { useI18n } from "@solid-primitives/i18n"
import { currentPageContext } from "#src/renderer/state.js"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	processedTableOfContents: ProcessedTableOfContents
	meta: ProcessedTableOfContents[string]
	markdown: Awaited<ReturnType<any>>
}

export function Page(props: PageProps) {
	const [, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() ?? defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	const replaceChars = (str: string) => {
		return str
			.replaceAll(" ", "-")
			.replaceAll("/", "")
			.replace("#", "")
			.replaceAll("(", "")
			.replaceAll(")", "")
			.replaceAll("?", "")
			.replaceAll(".", "")
			.replaceAll("@", "")
			.replaceAll(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, "")
			.replaceAll("✂", "")
	}

	const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
		const element = document.getElementById(anchor)
		if (element && window) {
			window.scrollTo({
				top: element.offsetTop - 96,
				behavior: behavior ?? "instant",
			})
		}
		window.history.pushState({}, "", `${currentPageContext.urlParsed.pathname}#${anchor}`)
	}

	onMount(async () => {
		for (const heading of props.markdown
			.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)
			.map((heading: string) => {
				// We have to use DOMParser to parse the heading string to a HTML element
				const parser = new DOMParser()
				const doc = parser.parseFromString(heading, "text/html")
				const node = doc.body.firstChild as HTMLElement

				return node.innerText.replace(/(<([^>]+)>)/gi, "").toString()
			})) {
			if (
				currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
				replaceChars(heading.toString().toLowerCase())
			) {
				/* Wait for all images to load before scrolling to anchor */
				await Promise.all(
					[...document.querySelectorAll("img")].map((img) =>
						img.complete
							? Promise.resolve()
							: new Promise((resolve) => img.addEventListener("load", resolve))
					)
				)

				scrollToAnchor(replaceChars(heading.toString().toLowerCase()), "smooth")
			}
		}
	})

	return (
		<>
			{/* frontmatter is undefined on first client side nav  */}
			<Title>
				{
					findPageBySlug(
						currentPageContext.urlParsed.pathname.replace(getLocale(), "").replace("/blog/", ""),
						props.processedTableOfContents
					)?.title
				}
			</Title>
			<Meta
				name="description"
				content={
					findPageBySlug(
						currentPageContext.urlParsed.pathname.replace(getLocale(), "").replace("/blog/", ""),
						props.processedTableOfContents
					)?.description
				}
			/>
			<Layout>
				<div class="grid-row-2 py-10 w-full mx-auto ">
					<Show
						when={props.markdown}
						fallback={<p class="text-danger">Parsing markdown went wrong.</p>}
					>
						<div class="mx-auto w-full 7 ml:px-8 justify-self-center">
							<Markdown markdown={props.markdown} />
						</div>
					</Show>
					<a class="flex justify-center link link-primary py-4 text-primary " href="/blog">
						&lt;- Back to Blog
					</a>
				</div>
			</Layout>
		</>
	)
}

function Markdown(props: { markdown: string }) {
	return (
		<article
			class="pt-24 pb-24 md:pt-10 prose w-full mx-auto max-w-3xl prose-code:py-0.5 prose-code:px-1 prose-code:bg-secondary-container prose-code:text-on-secondary-container prose-code:font-medium prose-code:rounded prose-code:before:hidden prose-code:after:hidden prose-p:text-base prose-sm prose-slate prose-li:py-1 prose-li:text-base prose-headings:font-semibold prose-headings:text-active-info prose-p:leading-7 prose-p:opacity-90 prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-t prose-h2:border-surface-3 prose-h2:pt-8 prose-h2:pb-4 prose-h3:text-[19px] prose-h3:pb-2 prose-table:text-base"
			// eslint-disable-next-line solid/no-innerhtml
			innerHTML={props.markdown}
		/>
	)
}

function findPageBySlug(slug: string, tableOfContents: ProcessedTableOfContents) {
	for (const category of Object.entries(tableOfContents)) {
		if (category[1].href.replace("/blog/", "") === slug) {
			return category[1]
		}
	}
	return undefined
}
