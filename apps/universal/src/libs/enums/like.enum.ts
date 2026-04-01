import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	PROPERTY = 'PROPERTY',
	ARTICLE = 'ARTICLE',
	ATTRACTION = 'ATTRACTION',
}
registerEnumType(LikeGroup, {
	name: 'LikeGroup',
});
