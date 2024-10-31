export const potentcialJobPostingButtonName = [
  "Apply",
  "Apply Now",
  "View Job Details",
  "See Full Job Description",
  "Explore Job",
  "View Details",
  "Job Overview",
  "See Full Posting",
  "See Requirements",
  "View Opportunity",
  "More About This Role",
  "Job Description",
  "Explore Position",
  "Learn More To Apply",
];

export const findJobPostingUrl = ({
  arrayOfUrls,
}: {
  arrayOfUrls: string[];
}) => {
  return `Consider the following urls: ${arrayOfUrls?.join(", ")}. Identify which URLs likely lead to job listing pages based solely on common URL patterns associated with job postings. Consider the following patterns when making your decision: Subdomains and paths: Look for subdomains like "jobs," "careers," or "apply," and paths such as /jobs/, /careers/, /openings/, /vacancies/, or /positions/. Job hosting platforms: Recognize URLs associated with common job hosting domains such as lever.co, greenhouse.io, workable.com, and other recruiting sites. Indirect job indicators: URLs may contain words like "opportunities," "join-us," "hiring," or "recruitment," even if the main job-related keywords aren't used directly. please only using the url from the array given only, do not auto generate any other url. If none of the url match the pattern, please return null`;
};

export const findTheProtencialJobTitles = ({
  pageLayout,
}: {
  pageLayout: string;
}) => {
  return `Given the page layout: ${pageLayout}.Identify the section that contain the job that are currently need person to apply for in the given page layout only return me back the job titles. Do not generate any other job titles or choose the job titles that are not in the opening section`;
};

export const findTheSelectorsOfTheJobTitles = ({
  jobTitle,
  pageLayout,
}: {
  jobTitle: string;
  pageLayout: string;
}) => {
  return `With the job titles given: ${jobTitle} and the page layout: ${pageLayout}, find the button to that matching with ${potentcialJobPostingButtonName.map(
    (buttonName) => `"${buttonName}"`,
  )} to apply for that job title and return all selectors that could match these text across different styles or classes. Here is the sample format of the selectors: div.button.tertiary-arrow.j-center.apply_job Please only return the selector of the given job title do not return any other selectors. If you can not find it, please return null`;
};

export const getJobDetails = ({
  pageLayout,
  jobTitles,
  alreadyProcessed,
}: {
  pageLayout: string;
  jobTitles: string[];
  alreadyProcessed: any[];
}) => {
  return `Given the page layout: ${pageLayout} and these jobTitles: ${jobTitles.map(
    (jobTitle) => `"${jobTitle}"`,
  )}, based on the job titles given, please extract the following details which relevant with one of those  ${jobTitles.map(
    (jobTitle) => `"${jobTitle}"`,
  )}: Company: The name of the company offering the job, Role title: The title of the job position, Role description: A detailed description of the job responsibilities and requirements, Role location: The location where the job is based, Role salary: The salary offered for the job, Date first posted: The date when the job was posted., Status: The status of the job posting is this open or closed. Please extract the data in the given page layout only. If the page layout does not contain any of the information, please ignor it please give me back the job title that your are processing. If the page layout contain more than one job title, based on this ${alreadyProcessed.map(
    (roleTitle) => `"${roleTitle}"`,
  )} Please do not process the job title that have this ${alreadyProcessed.map(
    (roleTitle) => `"${roleTitle}"`,
  )} in the already processed array`;
};

export const isThisTheJobPostingPage = ({
  pageLayout,
}: {
  pageLayout: string;
}) => {
  return `Consider the given page layout: ${pageLayout}, is this page layout contain the following information: Company: The name of the company offering the job, Role title: The title of the job position, Role description: A detailed description of the job responsibilities and requirements, Role location: The location where the job is based, Role salary: The salary offered for the job, Date first posted: The date when the job was posted., Status: The status of the job posting. Please extract from the page layout only, do not auto generate any information. Please return true if the page layout contain the information, otherwise return false`;
};

export const findTheSelectorOfThatJobTitle = ({
  pageLayout,
  jobTitle,
}: {
  pageLayout: string;
  jobTitle: string;
}) => {
  return `Given the page layout: ${pageLayout} and the job titles: ${jobTitle}, find and return a valid first degree css selector that will work in standard browsers. The selector must identify the link that potentially leads to the job posting page of the given job title. Please return the most specific but compatible selector possible, avoiding advanced pseudo-selectors like :has() or :contains(). The selector must contain the link that protentially lead to the job posting page of the given job title. Here is the sample format of the selectors: tag.class Please only return the selector of the given job title do not return any other selectors`;
};

export const foo = ({
  pageLayout,
  jobTitle,
}: {
  pageLayout: string;
  jobTitle: string;
}) => {
  return `Given the page layout: ${pageLayout} and the job titles: ${jobTitle}, with the given job title and the layout of the website, please find the url accosiate with that job title that potencial leading to the job details page. Please return the whole url only, do not remove anything from the url.`;
};

export const isThisUrlTheJobListingPage = ({
  pageLayout,
}: {
  pageLayout: String;
}) => {
  return `Given the page layout: ${pageLayout}. With the given page layout please identify is the page layout contain the job listing information (must contain the job title). please return true if the page layout contain the job listing information, otherwise return false`;
};


export const isPath = ({ url }: { url: string }) => {
  return `Given the url: ${url}. Is this url a path? Please return true if the url is a path, otherwise return false`;
};


export const combinePathToACompleteUrl = ({
  domain,
  path,
}: {
  domain: string;
  path: string;
}) => {
  return `Given the domain: ${domain} and the path: ${path}, 
  The URL must be valid. Combine it with the domain to form a complete URL: ${domain}${path}`;
};


export const isThisPageLayoutContainTheJobDetails = ({
  pageLayout,
  domain,
  jobTitles,
}: {
  pageLayout: string;
  domain: string;
  jobTitles: string[];
}) => {
  return `With the given page layout ${pageLayout}, we aready know that this url ${domain} is leading to the job details page. However, we need to confirm that the page layout contain the job details and relevant job titles: ${jobTitles.map(
    (jobTitle) => `"${jobTitle}"`,
  )}. Please return true if the page layout contain the job details , otherwise return false`;
};
