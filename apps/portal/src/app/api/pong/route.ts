// import { NextResponse } from "next/server";
// import { ParallelScraperService } from "../../../worker/parallelScraper";

// // Add type safety to the response
// interface ScrapingResponse {
//   successful: Record<string, any>;
//   failed: Record<string, any>;
//   successCount: number;
//   failureCount: number;
// }

// export async function GET(): Promise<NextResponse<ScrapingResponse | { error: string; message: unknown }>> {
//   const domains = [
//     "https://www.aigen.io/",
//     "http://11sight.com",
//     "http://15sof.com",
//     "http://adonis.io",
//     "http://advanced-ionics.com",
//     "http://advano.io",
//     "http://aifleet.com",
//     "http://aigen.io",
//     "http://alhaadilifestyles.com",
//     "http://amalgamrx.com/",
//     "http://anthology.ai",
//     "http://applaud.info",
//     "http://arrivobio.com/",
//     "http://asclepix.com/",
//     "http://authorhealth.com",
//     "http://bankingcrowded.com",
//     "http://BankingON.io",
//     "http://beatthebomb.com",
//     "http://bhtherapeutics.com",
//     "http://briq.com/",
//     "http://campus.edu",
//     "http://candesant.com",
//     "http://cardurion.com",
//     " http://cargosense.com",
//     "http://cloverleaf.me",
//     "http://collectly.co",
//     "http://compactmembrane.com",
//     "http://convergeins.com/",
//     "http://courpharma.com",
//     "http://cyrusbio.com",
//     "http://debutbiotech.com",
//     "http://disausa.com/",
//     "http://earthshot.eco/",
//     " http://envisagenics.com/",
//     "http://etherwhere.com",
//     "http://fcpeuro.com",
//     "http://figur8tech.com",
//     "http://fizzsocial.app",
//     "http://globalcomix.com",
//     "http://h3x.tech/",
//     "http://hebbia.ai",
//     "http://helixnano.com/",
//     "http://hellocake.com",
//     "http://hypervan.net",
//     "http://imaginepharma.com",
//     "http://inceptive.life",
//     "http://innerplant.com",
//     "http://inten.to",
//     "http://intensivate.com",
//     "http://intervene-med.com",
//     "http://invirsa.com/",
//     "http://jiritsu.network/",
//     "http://keonahealth.com",
//     "http://kuehnleagro.com",
//     "http://kyvernatx.com",
//     "http://laravel.com",
//     "http://lumeris.com/",
//     " http://luumlash.com",
//     "http://meacor.com/",
//     "http://memsdrive.com/",
//     "http://mercor.com",
//     "http://modelop.com",
//     "http://molecularstethoscope.com/",
//     "http://mozaic.io",
//     "http://mvpindex.com/",
//     "http://mytra.ai",
//     "http://noble.ai",
//     "http://nomic.ai/",
//     "http://notraffic.tech",
//     "http://nsaas.in",
//     "http://nullmax.ai/",
//     "http://occosoft.com/",
//     "http://ocergy.com/",
//     "http://ocient.com/",
//     "http://OfferFit.ai",
//     "http://onsiteiq.io/",
//     "http://perfumeo-ai.com",
//     "http://perryweather.com",
//     "http://pienso.com",
//     "http://proniras.com",
//     "http://quantumcircuits.com",
//     "http://quantumcyte.com/",
//     // ... your 6k domains ...
//   ];

//   const scraperService = ParallelScraperService.getInstance();

//   try {
//     const { results, errors } = await scraperService.scrapeCompanies(domains);

//     // Convert Maps to Objects for JSON response
//     const successfulResults = Object.fromEntries(results);
//     const failedResults = Object.fromEntries(errors);

//     return NextResponse.json({
//       successful: successfulResults,
//       failed: failedResults,
//       successCount: results.size,
//       failureCount: errors.size,
//     });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Scraping failed", message: error },
//       { status: 500 },
//     );
//   }
// }





import { NextResponse } from "next/server";
import { ScrapingService } from "@acme/scraping";


export async function GET() {
  const scrapingService = ScrapingService.getInstance();
  const result = await scrapingService.scrapeJobPostingPage(
    // "https://www.aigen.io/"
    // 'https://www.adonis.io/'
    "https://www.debutbiotech.com/",
    // "https://etherwhere.com/",
    // "https://abelpolice.com/",
    // "https://aby-bio.com/",
    // "https://www.accessprotocol.co/",
    // "https://www.accumatic.com/",
    // "https://nsaas.in/",
    // "https://aurascape.ai/"
  );
  return NextResponse.json({ message: "Pong!", result }, { status: 200 });
}