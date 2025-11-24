import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book } from '@/types/book';
import BuyersProtectionDialog from '@/components/BuyersProtectionDialog';

interface BookInfoProps {
  book: Book;
}

const BookInfo = ({ book }: BookInfoProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{book.title}</h1>
        <p className="text-lg md:text-xl text-gray-600 mb-4">by {book.author}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{book.category}</Badge>
          <Badge variant="outline">{book.condition} {book.itemType === "reader" && "reader"}</Badge>
          {book.sold && <Badge variant="destructive">Sold</Badge>}
        </div>

        {/* Buyer Protection banner placed above the details card */}
        <div className="mb-4">
          <BuyersProtectionDialog
            triggerType="banner"
            triggerLabel="Buyer Protection"
            triggerClassName=""
            triggerProps={{
              onClick: (e) => {
                // Prevent any parent click handlers (like navigation) from triggering
                e.stopPropagation();
              },
            }}
          />
        </div>
      </div>

      {/* Book Details */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-xl">Book Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <dt className="text-[12px] uppercase tracking-wide text-muted-foreground">Category</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{book.category}</dd>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <dt className="text-[12px] uppercase tracking-wide text-muted-foreground">Condition</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{book.condition} {book.itemType === "reader" && "reader"}</dd>
            </div>
            {typeof book.availableQuantity === 'number' && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="text-[12px] uppercase tracking-wide text-muted-foreground">Available</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{book.availableQuantity}</dd>
              </div>
            )}
            {book.universityYear && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="text-[12px] uppercase tracking-wide text-muted-foreground">University Year</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{book.universityYear}</dd>
              </div>
            )}
            {book.grade && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="text-[12px] uppercase tracking-wide text-muted-foreground">Grade</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{book.grade}</dd>
              </div>
            )}
            {book.curriculum && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="text-[12px] uppercase tracking-wide text-muted-foreground">Curriculum</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{book.curriculum}</dd>
              </div>
            )}
            {book.genre && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="text-[12px] uppercase tracking-wide text-muted-foreground">Genre</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{book.genre}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookInfo;
