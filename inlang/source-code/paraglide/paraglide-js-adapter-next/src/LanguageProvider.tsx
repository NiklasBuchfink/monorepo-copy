import {
	languageTag,
	setLanguageTag,
	isAvailableLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import { headers } from "next/headers"
import { ClientLanguageProvider } from "./ClientLanguageProvider"
import React from "react"

export default function LanguageProvider(props: { children: React.ReactNode }): React.ReactElement {
	const langHeader = headers().get("x-language-tag")
	if (isAvailableLanguageTag(langHeader)) {
		//setLanguageTag(langHeader)
	}

	//we make the client side language provider a sibling of the children
	//That way the entire app isn't turned into a client component
	return (
		<>
			{/* Pass the language tag to the client */}
			<ClientLanguageProvider language={languageTag()} />
			{props.children}
		</>
	)
}