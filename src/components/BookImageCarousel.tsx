import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';

interface BookImageCarouselProps {
  images: string[];
}

const BookImageCarousel = ({ images }: BookImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, currentImageIndex]);

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-pointer group">
          <img
            src={images[currentImageIndex]}
            alt={`Book image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onClick={openLightbox}
          />

          {/* Zoom indicator on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center pointer-events-none">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                className={`flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition-colors cursor-pointer ${
                  currentImageIndex === index
                    ? 'border-book-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl w-full h-screen sm:h-auto max-h-[95vh] p-0 border-0 bg-black/95 flex flex-col">
          <DialogClose className="absolute right-4 top-4 text-white hover:bg-white/20 z-10 rounded-md p-2" asChild>
            <button>
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>

          {/* Image container */}
          <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
            <img
              src={images[currentImageIndex]}
              alt={`Book image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Navigation controls and counter */}
          {images.length > 1 && (
            <div className="flex items-center justify-between gap-4 p-4 bg-black/50">
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20"
                onClick={prevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <div className="text-white text-sm font-medium min-w-fit">
                {currentImageIndex + 1} / {images.length}
              </div>

              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* Help text */}
          <div className="text-center text-white/60 text-xs py-2 px-4">
            Use arrow keys to navigate • ESC to close
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookImageCarousel;
