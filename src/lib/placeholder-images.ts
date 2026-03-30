import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// This export is no longer used but kept to avoid breaking other files if they reference it.
// Consider removing if it's confirmed to be unused everywhere.
export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
