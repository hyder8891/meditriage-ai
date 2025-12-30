import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicianLayout } from "@/components/ClinicianLayout";

function MedicalLiteratureContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: pubmedResults, isLoading: isPubMedLoading } = trpc.ncbi.searchPubMed.useQuery(
    {
      query: activeQuery,
      retmax: pageSize,
      retstart: page * pageSize,
    },
    {
      enabled: activeQuery.length > 0,
    }
  );

  const { data: pmcResults, isLoading: isPMCLoading } = trpc.ncbi.searchPMC.useQuery(
    {
      query: activeQuery,
      retmax: pageSize,
      retstart: page * pageSize,
    },
    {
      enabled: activeQuery.length > 0,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
      setPage(0);
    }
  };

  const handleNextPage = () => {
    setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    setPage((p) => Math.max(0, p - 1));
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          البحث في الأدبيات الطبية
        </h1>
        <p className="text-muted-foreground">
          ابحث في ملايين المقالات الطبية من PubMed و PubMed Central
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="ابحث عن مقالات طبية، حالات، علاجات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!searchQuery.trim()}>
            <Search className="h-4 w-4 ml-2" />
            بحث
          </Button>
        </div>
      </form>

      {/* Results */}
      {activeQuery && (
        <Tabs defaultValue="pubmed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pubmed">
              PubMed ({pubmedResults?.totalCount.toLocaleString() || 0})
            </TabsTrigger>
            <TabsTrigger value="pmc">
              PubMed Central ({pmcResults?.totalCount.toLocaleString() || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pubmed" className="space-y-4">
            {isPubMedLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pubmedResults && pubmedResults.articles.length > 0 ? (
              <>
                <div className="space-y-4">
                  {pubmedResults.articles.map((article) => (
                    <Card key={article.uid} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription>
                          <div className="flex flex-wrap gap-2 items-center text-sm">
                            <span>{article.source}</span>
                            {article.pubdate && (
                              <>
                                <span>•</span>
                                <span>{article.pubdate}</span>
                              </>
                            )}
                            {article.authors && article.authors.length > 0 && (
                              <>
                                <span>•</span>
                                <span>
                                  {article.authors[0]?.name}
                                  {article.authors.length > 1 && ` وآخرون`}
                                </span>
                              </>
                            )}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {article.articleids?.map((id) => (
                            <Badge key={id.idtype} variant="secondary">
                              {id.idtype.toUpperCase()}: {id.value}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              عرض على PubMed
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                          </Button>
                          {article.articleids?.find((id) => id.idtype === "pmc") && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${
                                  article.articleids.find((id) => id.idtype === "pmc")?.value
                                }/`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                النص الكامل
                                <ExternalLink className="ml-2 h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4 ml-2" />
                    السابق
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    صفحة {page + 1} من {Math.ceil(pubmedResults.totalCount / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!pubmedResults.hasMore}
                  >
                    التالي
                    <ChevronRight className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لم يتم العثور على نتائج لـ "{activeQuery}"
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pmc" className="space-y-4">
            {isPMCLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : pmcResults && pmcResults.pmcIds.length > 0 ? (
              <>
                <div className="space-y-4">
                  {pmcResults.pmcIds.map((pmcId) => (
                    <Card key={pmcId} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">مقالة PMC {pmcId}</CardTitle>
                        <CardDescription>النص الكامل متاح</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            عرض النص الكامل
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4 ml-2" />
                    السابق
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    صفحة {page + 1} من {Math.ceil(pmcResults.totalCount / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!pmcResults.hasMore}
                  >
                    التالي
                    <ChevronRight className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لم يتم العثور على مقالات بالنص الكامل لـ "{activeQuery}"
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!activeQuery && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">ابدأ البحث</h3>
            <p className="text-muted-foreground">
              أدخل مصطلحًا طبيًا أو حالة أو علاجًا للبحث في ملايين المقالات المراجعة من قبل الأقران
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MedicalLiterature() {
  return (
    <ClinicianLayout>
      <MedicalLiteratureContent />
    </ClinicianLayout>
  );
}
