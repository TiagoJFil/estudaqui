
import Image from 'next/image';

export function GithubIcon(
    props: React.ComponentProps<'img'> & { className?: string }
) {
    return (
        <Image 
            {...props}
            src="/github-mark.svg"
            alt="GitHub Icon"
            width={24}
            height={24}
            className={props.className}
        />
    );
}