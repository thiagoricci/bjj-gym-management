import * as React from 'react';
import { useIMask } from 'react-imask';
import { Input } from '@/components/ui/input';

type MaskedInputProps = Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> & {
  mask: any;
  value: string;
  onChange: (value: string) => void;
};

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, ...props }, ref) => {
    const {
      ref: imaskRef,
      setValue,
    } = useIMask(mask, {
      onAccept: (acceptedValue) => {
        onChange(acceptedValue as string);
      },
    });

    React.useEffect(() => {
      setValue(value);
    }, [value, setValue]);

    const combinedRef = (node: HTMLInputElement | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      (imaskRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    return <Input {...props} ref={combinedRef} defaultValue={value} />;
  }
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };