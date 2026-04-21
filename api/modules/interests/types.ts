/** API shape for a subcategory node; may nest further subcategories (seed tree). */
export interface InterestSubCategoryResponse {
  id: string;
  slug: string;
  name: string;
  suitableForAge: string | null;
  createdAt: Date;
  updatedAt: Date;
  subCategories: InterestSubCategoryResponse[];
}

/** API shape for a category with top-level subcategories only (each may nest). */
export interface InterestCategoryResponse {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  subCategories: InterestSubCategoryResponse[];
}
