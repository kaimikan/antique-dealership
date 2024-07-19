PGDMP         	                |           antique_dealership    15.4    15.4 !               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    16566    antique_dealership    DATABASE     �   CREATE DATABASE antique_dealership WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Bulgarian_Bulgaria.1252';
 "   DROP DATABASE antique_dealership;
                postgres    false            �            1259    16568    admins    TABLE     u   CREATE TABLE public.admins (
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
       public          postgres    false    215                       0    0    admins_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;
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
       public          postgres    false    219                       0    0    antiques_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.antiques_id_seq OWNED BY public.antiques.id;
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
       public          postgres    false    221                        0    0    categories_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
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
       public          postgres    false    217            !           0    0    images_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;
          public          postgres    false    216            t           2604    16571 	   admins id    DEFAULT     f   ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);
 8   ALTER TABLE public.admins ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    214    215    215            v           2604    16598    antiques id    DEFAULT     j   ALTER TABLE ONLY public.antiques ALTER COLUMN id SET DEFAULT nextval('public.antiques_id_seq'::regclass);
 :   ALTER TABLE public.antiques ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    218    219    219            w           2604    16613    categories id    DEFAULT     n   ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
 <   ALTER TABLE public.categories ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    220    221    221            u           2604    16589 	   images id    DEFAULT     f   ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);
 8   ALTER TABLE public.images ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    217    216    217                      0    16568    admins 
   TABLE DATA           =   COPY public.admins (id, username, password_hash) FROM stdin;
    public          postgres    false    215   �#                 0    16595    antiques 
   TABLE DATA           �   COPY public.antiques (id, name, description, category_ids, dimensions_centimeters, cost_euro, reference_number, main_image_id, secondary_images_ids) FROM stdin;
    public          postgres    false    219   X$                 0    16610 
   categories 
   TABLE DATA           I   COPY public.categories (id, name, description, filter_words) FROM stdin;
    public          postgres    false    221   E%                 0    16586    images 
   TABLE DATA           D   COPY public.images (id, name, path, alt, img_extension) FROM stdin;
    public          postgres    false    217   �%       "           0    0    admins_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.admins_id_seq', 1, true);
          public          postgres    false    214            #           0    0    antiques_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.antiques_id_seq', 6, true);
          public          postgres    false    218            $           0    0    categories_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.categories_id_seq', 2, true);
          public          postgres    false    220            %           0    0    images_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.images_id_seq', 4, true);
          public          postgres    false    216            z           2606    16575    admins admins_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.admins DROP CONSTRAINT admins_pkey;
       public            postgres    false    215            ~           2606    16603    antiques antiques_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.antiques
    ADD CONSTRAINT antiques_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.antiques DROP CONSTRAINT antiques_pkey;
       public            postgres    false    219            �           2606    16617    categories categories_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_pkey;
       public            postgres    false    221            |           2606    16593    images images_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.images DROP CONSTRAINT images_pkey;
       public            postgres    false    217            �           2606    16604 $   antiques antiques_main_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.antiques
    ADD CONSTRAINT antiques_main_image_id_fkey FOREIGN KEY (main_image_id) REFERENCES public.images(id);
 N   ALTER TABLE ONLY public.antiques DROP CONSTRAINT antiques_main_image_id_fkey;
       public          postgres    false    219    3196    217               U   x�3�LL�����K�T1JT14Rq�	4ssMr�K��2�w*��r.��H��5���,K�̳(�0�L��r7-03����� ��J         �   x��ѱj�0���YM�d�I�)�@��Y��b	j���{O����6��$���M{��:�݊���pk��{*�m�e�x��¢ǢEޝ\�{^xw�:O�e�=���w�&-�<��[N�>��c\���B*�
�*���	3�x�H�KR9��+X> �2��D>��@�1DM!1��W���,	�n�.���NJY?KI� �9�� �oB�D��~         q   x�3�L�H�,*�LTHN,IM�/�TH�/RH��Q ���df�*$�d��sV'�Et t1��X��3k��8��S���@2��QJ�I,.K)�(%�%�f&C��\1z\\\ d!;�         _   x�3�,I-.���M�7�L,.N-)���MLO-�LT I)�y�y�\F�Fj�S���R��d�s#�c��Y�����CGZ~iQI��=... ��D�     