-- DROP SCHEMA lp_api;

CREATE SCHEMA content_pages AUTHORIZATION "cms-user";

-- DROP SEQUENCE lp_api.landing_page_id_seq;

CREATE SEQUENCE content_pages.page_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
	CACHE 1
	NO CYCLE;

-- DROP SEQUENCE lp_api.template_id_seq;

CREATE SEQUENCE content_pages.template_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
	CACHE 1
	NO CYCLE;-- lp_api.carrier definition

CREATE TABLE content_pages."templates"
(
    id       serial4 NOT NULL UNIQUE,
    metadata json NULL,
    "label"  varchar NULL,
    CONSTRAINT template_pkey PRIMARY KEY (id)
);

CREATE TABLE content_pages.pages
(
    id          serial4 NOT NULL UNIQUE,
    "name"      varchar NOT NULL,
    template_id int4 NULL,
    properties  json NULL,
    metadata    json NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    "status"    varchar NULL,
    CONSTRAINT page_pkey PRIMARY KEY (id, name),
    CONSTRAINT page_template_id_fkey FOREIGN KEY (template_id) REFERENCES content_pages."templates" (id)
);
