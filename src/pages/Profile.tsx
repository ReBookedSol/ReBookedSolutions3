import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  BookOpen,
  Settings,
  MapPin,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Mail,
  Calendar,
  Package,
  TrendingUp,
  Share2,
  Eye,
  Phone,
  Clock,
  ShoppingBag,
  X,
  Wallet,
} from "lucide-react";
import { getUserBooks } from "@/services/book/bookQueries";
import { deleteBook } from "@/services/book/bookMutations";
import { saveUserAddresses, getUserAddresses, updateBooksPickupAddress } from "@/services/addressService";
import { Book } from "@/types/book";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import ModernAddressTab from "@/components/profile/ModernAddressTab";
import OrderManagementView from "@/components/orders/OrderManagementView";
import { useCommit } from "@/hooks/useCommit";
import EnhancedOrderCommitButton from "@/components/orders/EnhancedOrderCommitButton";
import BankingProfileTab from "@/components/profile/BankingProfileTab";
import WalletTab from "@/components/profile/WalletTab";
import ShareProfileDialog from "@/components/ShareProfileDialog";
import ShareReminderBanner from "@/components/ShareReminderBanner";
import ProfileEditDialog from "@/components/ProfileEditDialog";
// Transparency moved to standalone page
import { UserProfile, AddressData, Address } from "@/types/address";
import { handleAddressError, getUserFriendlyErrorMessage } from "@/utils/errorDisplayUtils";

const Profile = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeListings, setActiveListings] = useState<Book[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
    const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [deletingBooks, setDeletingBooks] = useState<Set<string>>(new Set());
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Transparency modal removed; use /transparency page instead
  const [phone, setPhone] = useState<string>(
    (user?.user_metadata as any)?.phone_number || (user?.user_metadata as any)?.phone || ""
  );

  useEffect(() => {
    setPhone(((user?.user_metadata as any)?.phone_number || (user?.user_metadata as any)?.phone) || "");
  }, [user]);

  const hasSavedPhone = Boolean(((user?.user_metadata as any)?.phone_number || (user?.user_metadata as any)?.phone));

  const loadActiveListings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingListings(true);
      const books = await getUserBooks(user.id);
      const activeBooks = Array.isArray(books)
        ? books.filter((book) => !book.sold)
        : [];
      setActiveListings(activeBooks);
    } catch (error) {
      console.error("Error loading active listings:", error);
      toast.error("Failed to load active listings");
      setActiveListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, [user?.id]);

  const loadUserAddresses = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingAddress(true);

      // Quick UI: try local cache first to avoid blank loading on mobile
      try {
        const cacheKey = `cached_address_${user.id}`;
        const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
        if (cached) {
          setAddressData(JSON.parse(cached));
        }
      } catch (cacheErr) {
        // ignore cache errors
      }

      const data = await getUserAddresses(user.id);
      setAddressData(data);

      // Update cache for next fast load
      try {
        const cacheKey = `cached_address_${user.id}`;
        if (typeof window !== 'undefined' && data) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (cacheErr) {
        // ignore cache failures
      }
    } catch (error) {
      const formattedError = handleAddressError(error, "load");
      console.error(formattedError.developerMessage, formattedError.originalError);
      toast.error(formattedError.userMessage);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadActiveListings();
      loadUserAddresses();
    }
  }, [user?.id, loadActiveListings, loadUserAddresses]);

  // Ensure addresses refresh when navigating back to the Addresses tab
  useEffect(() => {
    if (activeTab === 'addresses' && user?.id) {
      loadUserAddresses();
    }
  }, [activeTab, user?.id, loadUserAddresses]);

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!bookId) {
      toast.error("Book ID is missing");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingBooks((prev) => new Set(prev).add(bookId));

    try {
      await deleteBook(bookId, false); // Normal delete first
      toast.success("Book deleted successfully");
      await loadActiveListings();
    } catch (error: unknown) {
      // If deletion failed due to active orders, offer force delete option for admins
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("active order(s)") && profile?.is_admin) {
        const forceConfirm = confirm(
          `${errorMessage}\n\nAs an admin, you can force delete this book which will:\n` +
          "• Cancel all active orders for this book\n" +
          "• Trigger refunds for buyers\n" +
          "• Permanently remove the book\n\n" +
          "Do you want to force delete?"
        );

        if (forceConfirm) {
          try {
            await deleteBook(bookId, true); // Force delete
            toast.success("Book force deleted successfully - orders cancelled and refunds initiated");
            await loadActiveListings();
          } catch (forceError: unknown) {
            const forceErrorMessage = forceError instanceof Error ? forceError.message : String(forceError);
            toast.error(`Force delete failed: ${forceErrorMessage}`);
          }
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to delete book: ${errorMessage}`);
      }
    } finally {
      setDeletingBooks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const handleEditBook = (bookId: string) => {
    if (!bookId) {
      toast.error("Book ID is missing");
      return;
    }
    navigate(`/edit-book/${bookId}`);
  };

  const handleSaveAddresses = async (
    pickup: Address,
    shipping: Address,
    same: boolean,
  ) => {
    if (!user?.id) return;

    setIsLoadingAddress(true);
    try {
      await saveUserAddresses(user.id, pickup, shipping, same);
      await loadUserAddresses();

      // Update all user's book listings with the new pickup address and province
      try {
        const updateResult = await updateBooksPickupAddress(user.id, pickup);
        if (updateResult.success && updateResult.updatedCount > 0) {
          console.log(`Updated ${updateResult.updatedCount} book listings with new address and province`);
        }
      } catch (bookUpdateError) {
        console.warn("Failed to update book listings with new address:", bookUpdateError);
        // Don't fail the whole operation if book updates fail
      }

      toast.success("Addresses saved successfully");
    } catch (error) {
      const formattedError = handleAddressError(error, "save");
      console.error(formattedError.developerMessage, formattedError.originalError);
      toast.error(formattedError.userMessage);
      throw error;
    } finally {
      setIsLoadingAddress(false);
    }
  };

  if (!profile || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-book-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = {
    totalBooks: activeListings.length,
    totalValue: activeListings.reduce(
      (sum, book) => sum + (book.price || 0),
      0,
    ),
    avgPrice:
      activeListings.length > 0
        ? activeListings.reduce((sum, book) => sum + (book.price || 0), 0) /
          activeListings.length
        : 0,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-book-100 text-book-600 text-xl font-semibold">
                    {(
                      ([(profile as any)?.first_name, (profile as any)?.last_name].filter(Boolean).join(" ") || profile.name || "U")
                      .charAt(0)
                      ?.toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {[(profile as any)?.first_name, (profile as any)?.last_name].filter(Boolean).join(" ") || profile.name || "Anonymous User"}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined{" "}
                        {new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-book-600" />
                      <span className="font-semibold">{stats.totalBooks}</span>
                      <span className="text-gray-600">Books Listed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">
                        R{stats.totalValue.toFixed(0)}
                      </span>
                      <span className="text-gray-600">Total Value</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate("/create-listing")}
                    className="bg-book-600 hover:bg-book-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    List a Book
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {!isMobile && "Overview"}
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {!isMobile && "My Books"}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              {!isMobile && "Activity"}
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {!isMobile && "Wallet"}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {!isMobile && "Settings"}
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {!isMobile && "Addresses"}
            </TabsTrigger>
          </TabsList>

                    {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <ShareReminderBanner
              userId={user?.id || ""}
              userName={profile?.name || ""}
              onShare={() => setIsShareDialogOpen(true)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalBooks}</p>
                      <p className="text-gray-600">Active Listings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        R{stats.totalValue.toFixed(0)}
                      </p>
                      <p className="text-gray-600">Total Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        R{stats.avgPrice.toFixed(0)}
                      </p>
                      <p className="text-gray-600">Avg Price</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
                        </div>

            {/* Share Your Profile */}
            <Card className="bg-gradient-to-r from-book-50 to-book-100 border-book-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-book-800">
                      Share Your ReBooked Mini Page
                    </h3>
                    <p className="text-book-700 text-sm">
                      Share your profile to help your books sell faster! Post it on social media, send to classmates, or share in study groups.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsShareDialogOpen(true)}
                    className="bg-book-600 hover:bg-book-700 text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeListings.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No books listed yet</p>
                      <Button
                        onClick={() => navigate("/create-listing")}
                        className="mt-4 bg-book-600 hover:bg-book-700"
                      >
                        List Your First Book
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeListings.slice(0, 3).map((book) => (
                        <div
                          key={book.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <img
                            src={
                              book.frontCover ||
                              book.imageUrl ||
                              "/placeholder.svg"
                            }
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {book.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              by {book.author}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-book-600">
                              R{book.price}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {book.condition}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {activeListings.length > 3 && (
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("books")}
                          className="w-full"
                        >
                          View All {activeListings.length} Books
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Books ({activeListings.length})</CardTitle>
                <Button
                  onClick={() => navigate("/create-listing")}
                  className="bg-book-600 hover:bg-book-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Book
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingListings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading books...</p>
                  </div>
                ) : activeListings.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No books listed
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start selling by listing your first book
                    </p>
                    <Button
                      onClick={() => navigate("/create-listing")}
                      className="bg-book-600 hover:bg-book-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      List Your First Book
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeListings.map((book) => (
                      <Card
                        key={book.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <img
                              src={
                                book.frontCover ||
                                book.imageUrl ||
                                "/placeholder.svg"
                              }
                              alt={book.title}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900 line-clamp-2">
                                {book.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                by {book.author}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-lg font-bold text-book-600">
                                  R{book.price}
                                </p>
                                <Badge variant="secondary">
                                  {book.condition}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBook(book.id)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteBook(book.id, book.title)
                                }
                                disabled={deletingBooks.has(book.id)}
                                className="flex-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Tabs defaultValue="commits" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="commits" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Commits
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" /> Ongoing Orders
                </TabsTrigger>
              </TabsList>

              <TabsContent value="commits" className="space-y-4">
                {(() => {
                  const ActivityCommits: React.FC = () => {
                    const { user } = useAuth();
                    const { pendingCommits, refreshPendingCommits, declineBook, isCommitting, isDeclining } = useCommit();
                    const [now, setNow] = useState(new Date());
                    useEffect(() => {
                      refreshPendingCommits().catch(() => {});
                      const t = setInterval(() => setNow(new Date()), 5000);
                      return () => clearInterval(t);
                    }, [refreshPendingCommits]);
                    if (!pendingCommits || pendingCommits.length === 0) return (
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertDescription className="text-amber-800">No pending commits.</AlertDescription>
                      </Alert>
                    );
                    return (
                      <div className="space-y-4">
                        {pendingCommits.map((c: any) => {
                          const ms = Math.max(0, new Date(c.expiresAt).getTime() - now.getTime());
                          const mins = Math.floor(ms / 60000);
                          const hrs = Math.floor(mins / 60);
                          const rem = mins % 60;
                          const urgent = hrs < 12;
                          return (
                            <Card key={c.id} className={urgent ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}>
                              <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4 md:items-start">
                                  <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    <img src={c.imageUrl || "/placeholder.svg"} onError={(e: any) => (e.currentTarget.src = "/placeholder.svg")} className="w-full h-full object-cover" alt={c.bookTitle} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-slate-800 line-clamp-1">{c.bookTitle}</h3>
                                      {urgent && <Badge className="bg-red-500 text-white">URGENT</Badge>}
                                    </div>
                                    {c.author && <p className="text-sm text-gray-600 mb-2">by {c.author}</p>}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                                      <div className="flex items-center gap-2"><User className="h-4 w-4" />Buyer: <span className="font-medium">{c.buyerName}</span></div>
                                      <div className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-emerald-600" />Price: <span className="font-bold text-emerald-700">R{c.price?.toFixed?.(2) || c.price}</span></div>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-white/70">
                                      <Clock className={urgent ? "h-4 w-4 text-red-500" : "h-4 w-4 text-amber-600"} />
                                      <span className={urgent ? "text-red-600 font-medium" : "text-amber-700 font-medium"}>
                                        {mins <= 0 ? "Expired" : (hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`)} remaining
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 md:flex-col md:ml-4">
                                    <EnhancedOrderCommitButton
                                      orderId={c.id}
                                      sellerId={user?.id || ""}
                                      bookTitle={c.bookTitle}
                                      buyerName={c.buyerName}
                                      onCommitSuccess={() => refreshPendingCommits().catch(() => {})}
                                      disabled={isCommitting || isDeclining}
                                    />
                                    <Button
                                      variant="destructive"
                                      disabled={isCommitting || isDeclining}
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        try { await declineBook(c.id); await refreshPendingCommits(); } catch {}
                                      }}
                                    >
                                      <X className="h-4 w-4 mr-1" /> Decline
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  };
                  return <ActivityCommits />;
                })()}
              </TabsContent>

              <TabsContent value="orders">
                <OrderManagementView />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={profile.name || ""}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          const raw = e.target.value || "";
                          const digits = raw.replace(/\D/g, "");
                          let normalized = digits;
                          if (raw.trim().startsWith("+27") || digits.startsWith("27")) {
                            normalized = ("0" + digits.slice(2));
                          }
                          setPhone(normalized.slice(0, 10));
                        }}
                        placeholder="e.g., 0812345678"
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                        readOnly={hasSavedPhone}
                      />
                      {phone && !/^0\d{9}$/.test(phone) && (
                        <p className="text-xs text-amber-600 mt-1 pl-10">
                          South African numbers should start with 0 and be 10 digits. Please double-check.
                        </p>
                      )}
                    </div>
                    {hasSavedPhone ? (
                      <Button asChild variant="outline" size="sm" className="cursor-not-allowed opacity-70">
                        <a href="/contact">Contact Support to change</a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const digits = (phone || "").replace(/\D/g, "");
                            const normalized = digits.startsWith("27") ? ("0" + digits.slice(2)) : digits;
                            const phoneTrim = normalized.slice(0, 10);
                            if (phoneTrim && !/^0\d{9}$/.test(phoneTrim)) {
                              const proceed = window.confirm(
                                "Are you sure your number is correct? South African numbers should start with 0 and be 10 digits. It's used for delivery; if incorrect, couriers may not reach you and you may need to pay for rescheduling."
                              );
                              if (!proceed) return;
                            }
                            const { error } = await supabase.auth.updateUser({ data: { phone_number: phoneTrim || null, phone: phoneTrim || null } });
                            if (error) throw error;
                            if (user?.id) {
                              const { error: profileErr } = await supabase
                                .from('profiles')
                                .update({ phone_number: phoneTrim || null })
                                .eq('id', user.id)
                                .is('phone_number', null);
                              if (profileErr) throw profileErr;
                            }
                            toast.success("Phone number saved");
                          } catch (err) {
                            toast.error("Failed to save phone");
                          }
                        }}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Used for delivery updates and account security.</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Banking Information</h3>
                  <BankingProfileTab userId={user.id} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <ModernAddressTab
                  addressData={addressData}
                  onSaveAddresses={handleSaveAddresses}
                  isLoading={isLoadingAddress}
                />
              </CardContent>
            </Card>
          </TabsContent>
                </Tabs>
      </div>

      <ShareProfileDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        userId={user?.id || ""}
        userName={[(profile as any)?.first_name, (profile as any)?.last_name].filter(Boolean).join(" ") || profile?.name || "Anonymous User"}
        isOwnProfile={true}
      />

      <ProfileEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />

      {/* Transparency modal removed; use /transparency page */}
    </Layout>
  );
};

export default Profile;
