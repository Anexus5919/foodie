import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Slider } from "../../components/ui/slider";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../hooks/use-toast";
import { Star, Upload, X, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishName: string;
  dishId: string;
  onSubmit: (data: RatingData) => Promise<void>;
}

interface RatingData {
  dishId: string;
  rating: number;
  tasteRating: number;
  portionRating: number;
  packagingRating: number;
  freshnessRating: number;
  comment: string;
  photos: string[];
}

const ratingLabels = [
  "",
  "Terrible",
  "Very Bad",
  "Bad",
  "Below Average",
  "Average",
  "Above Average",
  "Good",
  "Very Good",
  "Excellent",
  "Perfect!",
];

export function RatingModal({
  open,
  onOpenChange,
  dishName,
  dishId,
  onSubmit,
}: RatingModalProps) {
  const [rating, setRating] = useState(8);
  const [tasteRating, setTasteRating] = useState(8);
  const [portionRating, setPortionRating] = useState(8);
  const [packagingRating, setPackagingRating] = useState(8);
  const [freshnessRating, setFreshnessRating] = useState(8);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert to base64 for demo (in production, would upload to Cloudinary)
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (photos.length < 3) {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        dishId,
        rating,
        tasteRating,
        portionRating,
        packagingRating,
        freshnessRating,
        comment,
        photos,
      });
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback",
      });
      onOpenChange(false);
    } catch {
      toast({
        title: "Failed to submit",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingSlider = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium text-primary">{value}/10</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate your dish</DialogTitle>
          <DialogDescription>{dishName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    value <= rating
                      ? value <= 3
                        ? "bg-red-500 text-white"
                        : value <= 6
                        ? "bg-yellow-500 text-white"
                        : "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                  data-testid={`rating-star-${value}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-lg font-medium">
              {ratingLabels[rating]}
            </p>
          </div>

          <Separator />

          {/* Category Ratings */}
          <div className="space-y-4">
            <h4 className="font-semibold">Rate specific aspects</h4>
            <RatingSlider
              label="Taste"
              value={tasteRating}
              onChange={setTasteRating}
            />
            <RatingSlider
              label="Portion Size"
              value={portionRating}
              onChange={setPortionRating}
            />
            <RatingSlider
              label="Packaging"
              value={packagingRating}
              onChange={setPackagingRating}
            />
            <RatingSlider
              label="Freshness"
              value={freshnessRating}
              onChange={setFreshnessRating}
            />
          </div>

          <Separator />

          {/* Photo Upload */}
          <div className="space-y-3">
            <Label>Add photos (optional)</Label>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative h-20 w-20 rounded-lg overflow-hidden"
                >
                  <img
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {photos.length < 3 && (
                <label className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover-elevate">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                    data-testid="input-photo-upload"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Add up to 3 photos of your dish
            </p>
          </div>

          <Separator />

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your review (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-24"
              data-testid="input-review-comment"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={isSubmitting}
          data-testid="button-submit-review"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Star className="h-4 w-4 mr-2" />
              Submit Review
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}