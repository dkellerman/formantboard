import { describe, expect, it } from "vitest";
import { MUSIC_RESOURCE_CATEGORIES, MUSIC_RESOURCES } from "@/lib/resources";

describe("resources registry", () => {
  it("defines categories and resources", () => {
    expect(MUSIC_RESOURCE_CATEGORIES.length).toBeGreaterThan(8);
    expect(MUSIC_RESOURCES.length).toBeGreaterThan(20);
  });

  it("uses unique category ids and resource ids", () => {
    const categoryIds = MUSIC_RESOURCE_CATEGORIES.map((category) => category.id);
    const resourceIds = MUSIC_RESOURCES.map((resource) => resource.id);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);
    expect(new Set(resourceIds).size).toBe(resourceIds.length);
  });

  it("links each resource to known categories", () => {
    const validCategories = new Set(MUSIC_RESOURCE_CATEGORIES.map((category) => category.id));
    for (const resource of MUSIC_RESOURCES) {
      expect(resource.categories.length).toBeGreaterThan(0);
      for (const category of resource.categories) {
        expect(validCategories.has(category)).toBe(true);
      }
    }
  });

  it("keeps URL and confidence fields in expected ranges", () => {
    for (const resource of MUSIC_RESOURCES) {
      expect(resource.url.startsWith("https://")).toBe(true);
      expect(resource.confidence).toBeGreaterThan(0);
      expect(resource.confidence).toBeLessThanOrEqual(1);
    }
  });
});
