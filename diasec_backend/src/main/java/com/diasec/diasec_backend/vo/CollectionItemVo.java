package com.diasec.diasec_backend.vo;

import lombok.Data;

@Data
public class CollectionItemVo {
    private int id;
    private int collectionId;
    private String label;
    private String times;
    private String imageUrl;
    private int sortOrder;
    private int count; // 상품 개수

    // join
    private String name;
    private String member_id;
    private String Author_name;
    private String nickname;
    private String oldLabel;
}
