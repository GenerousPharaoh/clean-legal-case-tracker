
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

/**
 * Fallback AudioTrack icon component
 * Used when the original MUI AudioTrack icon is not available
 */
export default function FallbackAudioTrack(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21s4.5-2.01 4.5-4.5V6h4V3h-7z" />
    </SvgIcon>
  );
}
