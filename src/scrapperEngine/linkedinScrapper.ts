export function linkedinJobPageScraper(): string {
  return `
    (() => {
      const parent = document.querySelector(
        'div[data-sdui-screen="com.linkedin.sdui.flagshipnav.jobs.SemanticJobDetails"]'
      );

      if (!parent) {
        return {
          success: false,
          data: null,
          error: "Job details parent not found"
        };
      }

      const jobTitle = parent.querySelector(
       'a[href*="/jobs/view/"]'
      )?.innerText?.trim() || null;

      const aboutJob = parent.querySelector(
        '[id^="JobDetails_AboutTheJob_"]'
      )?.innerText?.trim() || null;

      const aboutCompanyEl = parent.querySelector(
        '[id^="JobDetails_AboutTheCompany_"]'
      );


      const aboutCompany = aboutCompanyEl.querySelector(
        'span[tabindex="-1"][data-testid="expandable-text-box"]'
      )?.textContent?.trim();


      const company = parent.querySelector(
        '[aria-label^="Company"]'
      )?.innerText?.trim() || null;

      const logo = parent.querySelector(
        'img[alt^="Company logo for"]'
      );

      const logoUrl = logo?.currentSrc || logo?.src || null;

      return {
        success: true,
        data: {
          jobTitle,
          company,
          aboutJob,
          aboutCompany,
          logo: logoUrl,
          fullText: parent.innerText.trim()
        }
      };
    })();
  `;
}