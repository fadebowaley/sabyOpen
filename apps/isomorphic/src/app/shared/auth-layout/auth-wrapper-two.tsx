'use client';
import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { Avatar, Title, Text, Button } from 'rizzui';
import cn from '@core/utils/class-names';
import logoImg from '@public/logo-short.svg';
import starImg from '@public/auth/star.svg';
import sampleAD from '@public/slider/sampleAD.png';
import sampleB from '@public/slider/sampleB.png';
import sampleC from '@public/slider/sampleC.png';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@/config/routes';
import ArrowShape from '@core/components/shape/arrow';
import OrSeparation from './or-separation';
import {
  PiAppleLogoFill,
  PiArrowLeftBold,
  PiDribbbleLogo,
  PiFacebookLogo,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiTwitterLogo,
  PiArrowLineRight,
  PiUserCirclePlus,
  PiCheckCircle,
  PiSparkle,
} from 'react-icons/pi';
import { FcGoogle } from 'react-icons/fc';
import { useState, useEffect, useCallback } from 'react';
import { signIn } from 'next-auth/react';

export default function AuthWrapperTwo({
  children,
  title,
  isSocialLoginActive = false,
  isSignIn = false,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  isSocialLoginActive?: boolean;
  isSignIn?: boolean;
}) {
  const searchParams = useSearchParams();
  const callbackFromQuery = searchParams.get('callbackUrl');
  const callbackUrl =
    callbackFromQuery && callbackFromQuery.startsWith('/') ? callbackFromQuery : '/';

  return (
    <div className="min-h-screen items-center justify-center xl:flex xl:bg-gray-50 xl:px-5 xl:py-16 2xl:px-8 2xl:py-28">
      <div className="mx-auto w-full py-2 xl:py-14 2xl:w-[1720px]">
        <div className="rounded-xl bg-white dark:bg-transparent xl:flex dark:xl:bg-gray-100/50">
          <AuthNavBar callbackUrl={callbackUrl} />
          <IntroBannerBlock />
          <div className="flex w-full items-center px-4 xl:px-0">
            <div className="mx-auto w-full max-w-sm shrink-0 py-16 md:max-w-md xl:px-8 xl:py-10 2xl:max-w-xl 2xl:py-14 3xl:py-20">
              <Title
                as="h2"
                className="mb-6 text-center text-[26px] font-bold leading-snug md:!leading-normal xl:mb-8 xl:text-start xl:text-3xl xl:text-[28px] 2xl:-mt-1 2xl:text-4xl"
              >
                {title}
              </Title>
              {isSocialLoginActive && (
                <>
                  <SocialAuth callbackUrl={callbackUrl} />
                  <OrSeparation
                    className="mb-8 dark:before:bg-gray-200 xl:mb-7 dark:[&>span]:bg-[#191919]"
                    title={`OR ${isSignIn ? 'LOGIN' : 'SIGN UP'} WITH`}
                  />
                </>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthNavLink({
  href,
  activePath,
  children,
}: React.PropsWithChildren<{
  href: string;
  activePath?: string;
}>) {
  const pathname = usePathname();
  function isActive(href: string) {
    if (pathname === href || pathname === activePath) {
      return true;
    }
    return false;
  }

  return (
    <Link
      href={href}
      className={cn(
        "before:bg-primary-light relative flex items-center gap-x-1.5 text-[15px] font-medium text-gray-700 transition-colors duration-200 before:absolute before:bottom-0 before:start-0 before:h-0.5 before:content-[''] hover:text-gray-900 xl:gap-x-2.5 xl:px-6 xl:py-0.5 xl:text-base xl:before:top-0 xl:before:h-full 2xl:px-9 [&>svg]:w-[22px] [&>svg]:shrink-0 xl:[&>svg]:w-6",
        isActive(href) ? 'before:w-full xl:before:w-1' : ' '
      )}
    >
      {children}
    </Link>
  );
}

function AuthNavBar({ callbackUrl }: { callbackUrl: string }) {
  const signUpHref = `${routes.auth.signUp2}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const signInHref = `${routes.auth.signIn2}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="flex shrink-0 justify-between rounded-bl-xl rounded-tl-xl bg-white px-4 py-4 dark:bg-transparent xl:sticky xl:top-0 xl:w-36 xl:flex-col xl:items-center xl:justify-start xl:px-0 xl:py-14 2xl:w-[184px]">
      <Link href="/" className="mb-1 inline-block max-w-[64px]">
        <Image src={logoImg} alt="Isomorphic" className="dark:invert" />
      </Link>
      <div className="flex space-x-6 xl:w-full xl:flex-col xl:space-x-0 xl:space-y-6 xl:pt-9 2xl:space-y-7 2xl:pt-12 3xl:pt-14">
        <AuthNavLink href={signUpHref} activePath={routes.auth.signUp2}>
          <PiUserCirclePlus className="h-6 w-6" />
          Sign up
        </AuthNavLink>
        <AuthNavLink href={signInHref} activePath={routes.auth.signIn2}>
          <PiArrowLineRight className="h-[22px] w-[22px]" />
          Login
        </AuthNavLink>
      </div>
      <Link
        href={'/'}
        className="relative hidden items-center gap-x-1.5 text-[15px] font-medium text-gray-700 transition-colors duration-200 hover:text-gray-1000 xl:mt-auto xl:flex xl:gap-x-1.5 xl:py-0.5 xl:pe-6 xl:ps-3 xl:text-base xl:text-gray-500 xl:before:top-0 xl:before:h-full xl:hover:text-gray-700 2xl:pe-9 2xl:ps-7 [&>svg]:w-[22px] [&>svg]:shrink-0 xl:[&>svg]:w-6"
      >
        <PiArrowLeftBold />
        Back
      </Link>
    </div>
  );
}

function SocialAuth({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-4 pb-7 md:grid-cols-2 xl:gap-5 xl:pb-8">
      <Button
        type="button"
        className="h-11 w-full"
        variant="outline"
        rounded="pill"
        onClick={() =>
          router.push(`${routes.auth.signIn2}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        }
      >
        <PiAppleLogoFill className="me-2 h-4 w-4 shrink-0" />
        <span className="truncate">Signin With Apple</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        rounded="pill"
        onClick={() => void signIn('google', { callbackUrl })}
      >
        <FcGoogle className="me-2 h-4 w-4 shrink-0" />
        <span className="truncate">Signin With Google</span>
      </Button>
    </div>
  );
}

interface CarouselSlide {
  id: number;
  heroImage: StaticImageData | string;
  heading: string;
  description: string;
  features: {
    icon: React.ReactNode;
    text: string;
  }[];
}

function getHeroImageSrc(heroImage: CarouselSlide['heroImage']) {
  return typeof heroImage === 'string' ? heroImage : heroImage.src;
}

const carouselSlides: CarouselSlide[] = [
  {
    id: 1,
    heroImage: sampleAD,
    heading: 'Accept Donations Anywhere.',
    description: 'Give your congregation flexible ways to give. Set up digital giving in minutes. Accept tithes, offerings, and donations from any device, any time.',
    features: [
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Ready in minutes' },
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Multiple giving options' },
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Complete transparency' },
    ],
  },
  {
    id: 2,
    heroImage: sampleB,
    heading: 'Build Smarter. Grow Faster.',
    description: 'Saby empowers you to unify data, drive insights, and grow with clarity. Whether you\'re tracking payments, performance, or people — we help you see the Big picture.',
    features: [
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Real-time analytics' },
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Secure transactions' },
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Easy integration' },
    ],
  },
  {
    id: 3,
    heroImage: sampleC,
    heading: 'Streamline Your Ministry.',
    description: 'Manage your entire church operations from one platform. From member management to event planning, we make ministry administration simple and efficient.',
    features: [
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Member management' },
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Event planning' },
      { icon: <PiCheckCircle className="h-5 w-5" />, text: 'Communication tools' },
    ],
  },
];

function IntroBannerBlock() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
  }, [currentSlide]);

  // Light colors for indicators
  const indicatorColors = [
    'bg-cyan-300', // Light cyan
    'bg-blue-300', // Light blue
    'bg-indigo-300', // Light indigo
  ];

  return (
    <div className="relative hidden w-[calc(50%-50px)] shrink-0 rounded-3xl xl:-my-9 xl:block xl:w-[calc(50%-20px)] 2xl:-my-12 3xl:-my-14">
      {/* Solid Background - No images */}
      <div className="absolute mx-auto h-full w-full overflow-hidden rounded-3xl bg-[#043ABA]">
        {/* Subtle pattern overlay for texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#043ABA] via-[#0545C4] to-[#043ABA] opacity-100" />
      </div>

      {/* Content Section */}
      <div className="relative z-20 flex h-full flex-col justify-between rounded-3xl px-6 py-8 xl:px-10 xl:py-10 2xl:px-16 2xl:py-12">
        {/* Top Section - Icon */}
        <div className="absolute top-3 left-3 z-30 xl:top-4 xl:left-4 2xl:top-5 2xl:left-5">
          <div className="inline-flex items-center justify-center rounded-full bg-cyan-400/20 p-1.5">
            <PiSparkle className="h-3 w-3 text-cyan-300 xl:h-4 xl:w-4" />
          </div>
        </div>

        {/* Main Content - Reduced padding, shifted up */}
        <div className="flex flex-1 flex-col justify-start pt-6">
          {/* Hero Image Section - Carousel - Increased height */}
          <div className="mb-4 h-[320px] w-full overflow-hidden rounded-lg xl:h-[360px] 2xl:h-[380px]">
            <div className="relative h-full w-full">
              {carouselSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={cn(
                    'absolute inset-0 transition-opacity duration-500',
                    index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  )}
                >
                  <img
                    src={getHeroImageSrc(slide.heroImage)}
                    alt={slide.heading}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Text Content - Carousel */}
          <div className="relative text-white">
            {carouselSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  'transition-opacity duration-500',
                  index === currentSlide
                    ? 'opacity-100 relative z-10'
                    : 'opacity-0 absolute inset-0 z-0'
                )}
              >
                <Title
                  as="h2"
                  className="mb-3 text-[24px] font-bold leading-tight text-white xl:text-[28px] 2xl:text-[32px]"
                >
                  {slide.heading}
                </Title>
                <Text className="mb-4 text-sm leading-relaxed text-white/90 xl:mb-5 xl:text-base 2xl:max-w-[90%]">
                  {slide.description}
                </Text>

                {/* Feature Checklist */}
                <div className="mb-3 flex flex-wrap gap-4 xl:mb-4 xl:gap-6">
                  {slide.features.map((feature, featureIndex) => (
                    <div
                      key={`feature-${slide.id}-${featureIndex}`}
                      className="flex items-center gap-2"
                    >
                      <div className="flex-shrink-0 text-white">
                        {feature.icon}
                      </div>
                      <Text className="text-xs font-medium text-white xl:text-sm">
                        {feature.text}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Carousel Indicators - Thin and long progress bar style */}
            <div className="mt-3 flex w-full gap-1.5 xl:gap-2">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    index === currentSlide
                      ? `${indicatorColors[index]} opacity-100`
                      : `${indicatorColors[index]} opacity-40 hover:opacity-60`
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section - Social Links */}
        <div className="mt-2">
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}

const socialLinks = [
  {
    title: 'Facebook',
    link: 'https://www.facebook.com/sabyglobal',
    icon: <PiFacebookLogo className="h-auto w-4" />,
  },
  {
    title: 'Twitter',
    link: 'https://twitter.com/sabyglobal',
    icon: <PiTwitterLogo className="h-auto w-4" />,
  },
  {
    title: 'Instagram',
    link: 'https://www.instagram.com/sabygloba',
    icon: <PiInstagramLogo className="h-auto w-4" />,
  },
  {
    title: 'Linkedin',
    link: 'https://www.linkedin.com/company/sabyglobal/',
    icon: <PiLinkedinLogo className="h-auto w-4" />,
  },
];
function SocialLinks() {
  return (
    <div className="-mx-2 flex items-center pt-4 text-white xl:-mx-2.5 xl:pt-6 [&>a>svg]:w-5 xl:[&>a>svg]:w-6">
      {socialLinks.map((item) => (
        <a
          key={item.title}
          href={item.link}
          title={item.title}
          target="_blank"
          className="mx-2 transition-opacity hover:opacity-80 xl:mx-2.5"
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

const members = [
  'https://randomuser.me/api/portraits/women/40.jpg',
  'https://randomuser.me/api/portraits/women/41.jpg',
  'https://randomuser.me/api/portraits/women/42.jpg',
  'https://randomuser.me/api/portraits/women/43.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
];
function JoinedMember() {
  return (
    <div className="flex items-center">
      <div className="mx-0.5">
        {members.map((member) => (
          <Avatar
            key={member}
            src={member}
            name="avatar"
            className="relative -mx-0.5 inline-flex object-cover ring-2 ring-gray-0"
          />
        ))}
      </div>
      <div className="relative inline-flex items-center justify-center px-3 text-xs font-semibold">
        Trusted by over 30,000 users. Start now.
      </div>
      <ArrowShape className="h-11 w-10 text-white" />
    </div>
  );
}
