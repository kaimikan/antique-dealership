PGDMP     8    2                |           antique_dealership    15.4    15.4 #               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    16566    antique_dealership    DATABASE     �   CREATE DATABASE antique_dealership WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Bulgarian_Bulgaria.1252';
 "   DROP DATABASE antique_dealership;
                postgres    false            �            1255    16618    generate_reference_number()    FUNCTION     �   CREATE FUNCTION public.generate_reference_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.reference_number := '#' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$;
 2   DROP FUNCTION public.generate_reference_number();
       public          postgres    false            �            1259    16568    admins    TABLE     u   CREATE TABLE public.admins (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL
);
    DROP TABLE public.admins;
       public         heap    postgres    false            �            1259    16567    admins_id_seq    SEQUENCE     �   CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.admins_id_seq;
       public          postgres    false    215                        0    0    admins_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;
          public          postgres    false    214            �            1259    16595    antiques    TABLE     �  CREATE TABLE public.antiques (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category_ids integer[] NOT NULL,
    dimensions_centimeters text NOT NULL,
    cost_euro double precision NOT NULL,
    reference_number text NOT NULL,
    main_image_id integer NOT NULL,
    secondary_images_ids integer[],
    CONSTRAINT antiques_cost_euro_check CHECK (((cost_euro >= (0)::double precision) AND (cost_euro <= (10000000)::double precision)))
);
    DROP TABLE public.antiques;
       public         heap    postgres    false            �            1259    16594    antiques_id_seq    SEQUENCE     �   CREATE SEQUENCE public.antiques_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.antiques_id_seq;
       public          postgres    false    219            !           0    0    antiques_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.antiques_id_seq OWNED BY public.antiques.id;
          public          postgres    false    218            �            1259    16610 
   categories    TABLE     �   CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    filter_words text[] NOT NULL
);
    DROP TABLE public.categories;
       public         heap    postgres    false            �            1259    16609    categories_id_seq    SEQUENCE     �   CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.categories_id_seq;
       public          postgres    false    221            "           0    0    categories_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
          public          postgres    false    220            �            1259    16586    images    TABLE     �   CREATE TABLE public.images (
    id integer NOT NULL,
    name text NOT NULL,
    path text NOT NULL,
    alt text NOT NULL,
    img_extension text NOT NULL
);
    DROP TABLE public.images;
       public         heap    postgres    false            �            1259    16585    images_id_seq    SEQUENCE     �   CREATE SEQUENCE public.images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.images_id_seq;
       public          postgres    false    217            #           0    0    images_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;
          public          postgres    false    216            u           2604    16571 	   admins id    DEFAULT     f   ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);
 8   ALTER TABLE public.admins ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    214    215    215            w           2604    16598    antiques id    DEFAULT     j   ALTER TABLE ONLY public.antiques ALTER COLUMN id SET DEFAULT nextval('public.antiques_id_seq'::regclass);
 :   ALTER TABLE public.antiques ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    219    218    219            x           2604    16613    categories id    DEFAULT     n   ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
 <   ALTER TABLE public.categories ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    221    220    221            v           2604    16589 	   images id    DEFAULT     f   ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);
 8   ALTER TABLE public.images ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    217    216    217                      0    16568    admins 
   TABLE DATA           =   COPY public.admins (id, username, password_hash) FROM stdin;
    public          postgres    false    215   �&                 0    16595    antiques 
   TABLE DATA           �   COPY public.antiques (id, name, description, category_ids, dimensions_centimeters, cost_euro, reference_number, main_image_id, secondary_images_ids) FROM stdin;
    public          postgres    false    219   K'                 0    16610 
   categories 
   TABLE DATA           I   COPY public.categories (id, name, description, filter_words) FROM stdin;
    public          postgres    false    221   �(                 0    16586    images 
   TABLE DATA           D   COPY public.images (id, name, path, alt, img_extension) FROM stdin;
    public          postgres    false    217   v)       $           0    0    admins_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.admins_id_seq', 1, true);
          public          postgres    false    214            %           0    0    antiques_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.antiques_id_seq', 40, true);
          public          postgres    false    218            &           0    0    categories_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.categories_id_seq', 3, true);
          public          postgres    false    220            '           0    0    images_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.images_id_seq', 162, true);
          public          postgres    false    216            {           2606    16575    admins admins_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.admins DROP CONSTRAINT admins_pkey;
       public            postgres    false    215                       2606    16603    antiques antiques_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.antiques
    ADD CONSTRAINT antiques_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.antiques DROP CONSTRAINT antiques_pkey;
       public            postgres    false    219            �           2606    16617    categories categories_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_pkey;
       public            postgres    false    221            }           2606    16593    images images_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.images DROP CONSTRAINT images_pkey;
       public            postgres    false    217            �           2620    16619    antiques set_reference_number    TRIGGER     �   CREATE TRIGGER set_reference_number BEFORE INSERT ON public.antiques FOR EACH ROW EXECUTE FUNCTION public.generate_reference_number();
 6   DROP TRIGGER set_reference_number ON public.antiques;
       public          postgres    false    219    222            �           2606    16604 $   antiques antiques_main_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.antiques
    ADD CONSTRAINT antiques_main_image_id_fkey FOREIGN KEY (main_image_id) REFERENCES public.images(id);
 N   ALTER TABLE ONLY public.antiques DROP CONSTRAINT antiques_main_image_id_fkey;
       public          postgres    false    217    219    3197               U   x�3�LL�����K�T1JT14Rq�	4ssMr�K��2�w*��r.��H��5���,K�̳(�0�L��r7-03����� ��J         ~  x���OO�@��ç��W�0��LcL<xl���Z�e��*�5������/�2���{��e{������wo�:X���C[�:J<z[��hZ���m\�?��h����pgݶ	�H�X���աaEI��veh3��D�G��0A�(�q�?HT9&4&�Q�"�h.P�-��>#������PL�(&i�%�"BH.�O�\����H��k�1�dpG8�¥�.��������5_{S)�&V�����Z��ԟ������h����y�YX5�#��u��e|pk��wۖ}�h_m�Ω��9�F6��T?��$�
^<�t"�`���E���%3�d
ah.�䨽 �1���9R��pC*�SRN%����,�> �         �   x�m��� ����3����a�Uld[fb�����S��_����(0
��/s�l FS�.��B�E����\�2����I�7�X��l� R�u�#�@��I�T�KܖU����ڽ�<���mO�Rh����Z ��ZU         <  x���Kn�0E�f�@R��7N[uު�J�!/�� �s�.���H�(Ct�9[fR�g�@7�B�
�+�Q}��϶^�rU�-�,�L&B�T�!�`�:� ٍ�b6��P��]ñ;,��L���m�5+Z��XZ���|l�k����!gC�(J�L���V,�L!��X�(���S�|:��:L��S9v0�)���
z>	���/?��w�gж�8L3��F`�j� z������ِ�w����7N�
!/JU������={M� ��:r�0���Y>w�E��ٹ��������7��	�-+�o��)]�k�/��E�     