/** Theme linked to an interest category (replaces subcategories). */
export interface InterestThemeResponse {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/** API shape for a category with its themes. */
export interface InterestCategoryResponse {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  themes: InterestThemeResponse[];
}
