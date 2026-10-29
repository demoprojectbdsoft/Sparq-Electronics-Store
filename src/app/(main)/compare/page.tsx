import CompareClient from "./CompareClient";

export const metadata = {
  // The root layout appends "| <siteName>" from settings.
  title: "Compare Products",
  description:
    "Compare up to three products side by side: price, rating, availability, warranty and full specifications.",
};

export default function ComparePage() {
  return <CompareClient />;
}
