type EmbedType = {
  title: string;
  description?: string;
  color?: string | number;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  imageUrl?: string;
  footer?: {
    text: string;
    iconUrl?: string;
  };
};

export default EmbedType;
