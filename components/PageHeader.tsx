"use client";

import { Text } from "./common";

/**
 * Interface for PageHeader component props
 * @param title - Main heading title
 * @param subtitle - Secondary text subtitle
 */
interface PageHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * PageHeader Component
 * Displays a consistent page header with title and subtitle
 * Used at the top of pages to provide context and welcome message
 *
 * @param {PageHeaderProps} props - Component props
 * @returns {JSX.Element} - Rendered page header component
 */
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      {/* Main Title */}
      <Text variant="h2" weight="bold">
        {title}
      </Text>

      {/* Subtitle */}
      <Text variant="caption" color="muted" className="max-w-xs md:max-w-full">
        {subtitle}
      </Text>
    </div>
  );
}
