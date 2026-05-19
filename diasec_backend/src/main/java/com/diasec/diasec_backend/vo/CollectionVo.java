package com.diasec.diasec_backend.vo;

import java.util.List;

import lombok.Data;

@Data
public class CollectionVo {
    private int id;
    private String name;
    private String displayName;

    private List<CollectionItemVo> items;
}
