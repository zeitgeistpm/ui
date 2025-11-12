import { CSSProperties, FC, useMemo } from "react";
import Link from "next/link";
import { CmsNews } from "lib/cms/news";
import { isCurrentOrigin } from "lib/util/is-current-origin";

export interface HeroSlideProps {
  className?: string;
  style?: CSSProperties;
  banner: CmsNews;
}

export const HeroSlide: FC<HeroSlideProps> = ({ banner, style, className }) => {
  return <></>;
  // const link = banner.link?.isMarket
  //           ? `/markets/${news.link?.market?.marketId}`
  //           : news.link?.url;

  //         const isExternalLink = link ? !isCurrentOrigin(link) : false;

  // const isExternalLink = banner.ctaLink
  //   ? !isCurrentOrigin(banner.ctaLink)
  //   : false;
  // const linkProps = {
  //   style: {
  //     backgroundColor: `${banner.buttonColor}`,
  //     borderColor: `${banner.buttonColor}`,
  //     color: banner.buttonTextColor,
  //   },
  //   className:
  //     "leading-[42px] w-full sm:w-fit text-center sm:text-start border rounded px-5 mb-5 mr-5 font-bold",
  //   href: banner.ctaLink,
  // };

  // return (
  //   <div
  //     className={`flex h-full w-full items-center ${className}`}
  //     style={style}
  //   >
  //     <div className="w-full pb-8">
  //       <h2
  //         className={`mb-4 text-center font-sans text-5xl font-extrabold text-white/90 sm:text-left sm:text-7xl md:whitespace-pre lg:text-8xl`}
  //       >
  //         {banner.title}
  //       </h2>
  //       <p
  //         className={
  //           "mb-6 whitespace-pre text-center font-sans text-3xl font-extrabold text-white/90 sm:text-start md:text-4xl"
  //         }
  //       >
  //         {banner.subtitle}
  //       </p>
  //       <div className="flex flex-col sm:flex-row">
  //         {isExternalLink ? (
  //           <a {...linkProps} target="_blank">
  //             {banner.ctaText}
  //           </a>
  //         ) : (
  //           <>
  //             {linkProps.href && (
  //               <Link
  //                 href={linkProps.href}
  //                 className={linkProps.className}
  //                 style={linkProps.style}
  //               >
  //                 {banner.ctaText}
  //               </Link>
  //             )}
  //           </>
  //         )}
  //       </div>
  //     </div>
  //   </div>
  // );
};
